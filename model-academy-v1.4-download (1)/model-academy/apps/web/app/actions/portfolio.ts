'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export async function updatePortfolio(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const title = String(form.get('title') || '').trim().slice(0, 80);
  const description = String(form.get('description') || '').trim().slice(0, 1200);
  if (!title) redirect('/dashboard/portfolio?error=title');
  const publicPortfolio = form.get('publicPortfolio') === 'on';
  await prisma.modelProfile.update({ where: { id: user.modelProfile.id }, data: { publicPortfolio } });
  await prisma.portfolio.upsert({
    where: { modelId: user.modelProfile.id },
    update: { title, description: description || null },
    create: { modelId: user.modelProfile.id, title, description: description || null },
  });
  revalidatePath('/dashboard/portfolio');
  redirect('/dashboard/portfolio?saved=1');
}
