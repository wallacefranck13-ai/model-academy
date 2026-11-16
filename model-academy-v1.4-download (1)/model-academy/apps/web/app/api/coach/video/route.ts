import { NextResponse } from 'next/server';
import { prisma } from '@model-academy/database';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/current-user';

export const runtime = 'nodejs';

const MAX_BYTES = 40 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.authUserId) {
      return NextResponse.json({ error: 'Connecte-toi pour envoyer une vidéo.' }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get('video');
    const focus = String(form.get('focus') || 'GENERAL');
    const consent = form.get('consent') === 'true';

    if (!consent) {
      return NextResponse.json({ error: 'Le consentement au traitement de cette vidéo est obligatoire.' }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Sélectionne une vidéo.' }, { status: 400 });
    }
    if (!MIME_EXTENSIONS[file.type]) {
      return NextResponse.json({ error: 'Format accepté : MP4, MOV ou WEBM.' }, { status: 400 });
    }
    if (file.size < 1 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'La vidéo doit peser moins de 40 Mo.' }, { status: 400 });
    }

    const supabase = await createClient();
    const sessionId = crypto.randomUUID();
    const storageKey = `${user.authUserId}/${sessionId}.${MIME_EXTENSIONS[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from('model-training')
      .upload(storageKey, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({
        error: 'Envoi impossible. Vérifie que le stockage privé « model-training » est créé et que ses règles d’accès sont installées.',
      }, { status: 503 });
    }

    const session = await prisma.aITrainingSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        sessionType: focus,
        videoStorageKey: storageKey,
        status: 'UPLOADED_PENDING_ANALYSIS',
      },
      select: { id: true, sessionType: true, status: true, createdAt: true },
    });

    return NextResponse.json({
      session: { ...session, createdAt: session.createdAt.toISOString() },
      message: 'Vidéo reçue et stockée de manière privée. Son analyse automatique sera activée avec le moteur de vision.',
    });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue pendant l’envoi.' }, { status: 500 });
  }
}
