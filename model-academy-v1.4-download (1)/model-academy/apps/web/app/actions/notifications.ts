'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export async function markNotificationRead(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const id = String(form.get('notificationId') || '');
  if (!id) redirect('/dashboard/notifications');
  await prisma.notification.updateMany({ where: { id, userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard');
  redirect('/dashboard/notifications');
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  await prisma.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard');
  redirect('/dashboard/notifications');
}
