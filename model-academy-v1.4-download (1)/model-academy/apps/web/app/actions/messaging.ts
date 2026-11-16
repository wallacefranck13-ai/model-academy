'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export async function openConversationForApplication(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const applicationId = String(form.get('applicationId') || '').trim();
  if (!applicationId) redirect('/dashboard/recruiter?error=conversation');
  const application = await prisma.castingApplication.findUnique({
    where: { id: applicationId },
    include: { casting: true, model: { select: { userId: true } } },
  });
  if (!application || !['PUBLISHED', 'CLOSED'].includes(application.casting.status) ||
      (application.casting.ownerId !== user.id && application.model.userId !== user.id)) redirect('/dashboard?error=forbidden');
  if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') redirect('/dashboard/recruiter?error=closed');
  const userAId = application.casting.ownerId;
  const userBId = application.model.userId;
  if (userAId === userBId) redirect('/dashboard?error=conversation');
  const conversation = await prisma.conversation.upsert({
    where: { castingApplicationId: application.id },
    update: {},
    create: { userAId, userBId, castingApplicationId: application.id },
    select: { id: true },
  });
  redirect(`/dashboard/messages/${conversation.id}`);
}

export async function sendMessage(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const conversationId = String(form.get('conversationId') || '').trim();
  const body = String(form.get('body') || '').trim();
  if (!conversationId || body.length < 1 || body.length > 2000) redirect('/dashboard/messages?error=message');
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, OR: [{ userAId: user.id }, { userBId: user.id }] },
    select: { id: true, userAId: true, userBId: true },
  });
  if (!conversation) redirect('/dashboard/messages?error=forbidden');
  const recentCount = await prisma.message.count({
    where: { senderId: user.id, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recentCount >= 30) redirect(`/dashboard/messages/${conversationId}?error=rate`);
  const recipientId = conversation.userAId === user.id ? conversation.userBId : conversation.userAId;
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: user.id, body } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } }),
    prisma.notification.create({ data: { userId: recipientId, title: 'Nouveau message', message: `${user.fullName} vous a envoyé un message.` } }),
  ]);
  revalidatePath('/dashboard/messages');
  revalidatePath(`/dashboard/messages/${conversationId}`);
  redirect(`/dashboard/messages/${conversationId}`);
}
