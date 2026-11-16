import { NextResponse } from 'next/server';
import { prisma } from '@model-academy/database';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/current-user';

export const runtime = 'nodejs';
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.authUserId || !user.modelProfile) return NextResponse.json({ error: 'Connecte-toi pour compléter ton portfolio.' }, { status: 401 });
    const form = await request.formData();
    const file = form.get('image');
    const caption = String(form.get('caption') || '').trim().slice(0, 180);
    if (form.get('consent') !== 'true') return NextResponse.json({ error: 'Le consentement au stockage privé est obligatoire.' }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: 'Sélectionne une image.' }, { status: 400 });
    if (!TYPES[file.type]) return NextResponse.json({ error: 'Formats acceptés : JPG, PNG et WEBP.' }, { status: 400 });
    if (file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: 'L’image doit peser moins de 8 Mo.' }, { status: 400 });

    const supabase = await createClient();
    const portfolio = await prisma.portfolio.upsert({
      where: { modelId: user.modelProfile.id }, update: {},
      create: { modelId: user.modelProfile.id, title: `Portfolio de ${user.fullName}` },
    });
    const mediaId = crypto.randomUUID();
    const storageKey = `${user.authUserId}/${mediaId}.${TYPES[file.type]}`;
    const { error: uploadError } = await supabase.storage.from('model-portfolio').upload(storageKey, file, { contentType: file.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: 'Stockage indisponible. Vérifie le bucket privé model-portfolio et ses politiques.' }, { status: 503 });

    try {
      const media = await prisma.portfolioMedia.create({
        data: {
          id: mediaId, portfolioId: portfolio.id, storageKey, mediaType: 'IMAGE',
          visibility: 'PRIVATE', caption: caption || null,
          consents: { create: { purpose: 'PORTFOLIO_PRIVATE_STORAGE', grantedAt: new Date() } },
        },
        select: { id: true, caption: true, visibility: true, createdAt: true },
      });
      return NextResponse.json({ media, message: 'Image ajoutée à ton portfolio privé.' });
    } catch (error) {
      await supabase.storage.from('model-portfolio').remove([storageKey]);
      throw error;
    }
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue pendant l’ajout de cette image.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.authUserId || !user.modelProfile) return NextResponse.json({ error: 'Connecte-toi.' }, { status: 401 });
    const body = await request.json();
    if (typeof body.mediaId !== 'string' || !body.mediaId) return NextResponse.json({ error: 'Image invalide.' }, { status: 400 });
    const media = await prisma.portfolioMedia.findFirst({
      where: { id: body.mediaId, portfolio: { modelId: user.modelProfile.id } },
      select: { id: true, storageKey: true },
    });
    if (!media) return NextResponse.json({ error: 'Image introuvable.' }, { status: 404 });
    const supabase = await createClient();
    const { error } = await supabase.storage.from('model-portfolio').remove([media.storageKey]);
    if (error) return NextResponse.json({ error: 'Impossible de supprimer le fichier privé. Réessaie.' }, { status: 503 });
    await prisma.portfolioMedia.delete({ where: { id: media.id } });
    return NextResponse.json({ message: 'Image supprimée de ton portfolio.' });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue pendant la suppression.' }, { status: 500 });
  }
}
