'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export async function respondToContract(contractId: string, decision: 'accept' | 'decline') {
  const user = await getCurrentUser();
  if (!user?.modelProfile || !contractId || contractId.length > 128) return { ok: false, message: 'Session ou profil invalide.' };
  const contract = await prisma.contract.findFirst({ where: { id: contractId, modelId: user.modelProfile.id } });
  if (!contract) return { ok: false, message: 'Contrat introuvable.' };
  if (!['PROPOSED', 'PENDING', 'SENT'].includes(contract.status)) return { ok: false, message: 'Cette proposition a déjà été traitée.' };
  const now = new Date();
  await prisma.contract.update({ where: { id: contract.id }, data: decision === 'accept'
    ? { status: 'ACCEPTED_PENDING_SIGNATURE', acceptedAt: now }
    : { status: 'DECLINED', rejectedAt: now } });
  await prisma.notification.create({ data: { userId: user.id, title: decision === 'accept' ? 'Proposition acceptée' : 'Proposition refusée', message: `Tu as ${decision === 'accept' ? 'accepté' : 'refusé'} la proposition « ${contract.title} ». La signature formelle reste à effectuer séparément.` } });
  revalidatePath('/dashboard/contracts');
  revalidatePath('/dashboard/notifications');
  return { ok: true, message: decision === 'accept' ? 'Proposition acceptée. La signature reste à finaliser.' : 'Proposition refusée.' };
}

export async function respondToBooking(bookingId: string, decision: 'accept' | 'decline') {
  const user = await getCurrentUser();
  if (!user?.modelProfile || !bookingId || bookingId.length > 128) return { ok: false, message: 'Session ou profil invalide.' };
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, modelId: user.modelProfile.id } });
  if (!booking) return { ok: false, message: 'Réservation introuvable.' };
  if (!['PROPOSED', 'PENDING'].includes(booking.status)) return { ok: false, message: 'Cette réservation a déjà été traitée.' };
  await prisma.booking.update({ where: { id: booking.id }, data: { status: decision === 'accept' ? 'CONFIRMED' : 'DECLINED', respondedAt: new Date() } });
  await prisma.notification.create({ data: { userId: user.id, title: decision === 'accept' ? 'Réservation confirmée' : 'Réservation refusée', message: `Tu as ${decision === 'accept' ? 'confirmé' : 'refusé'} « ${booking.title} ».` } });
  revalidatePath('/dashboard/bookings');
  revalidatePath('/dashboard/notifications');
  return { ok: true, message: decision === 'accept' ? 'Réservation confirmée.' : 'Réservation refusée.' };
}
