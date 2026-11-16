'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export async function createSponsorOpportunity(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user.roles.some(r => r.role === 'SPONSOR' || r.role === 'ADMIN')) redirect('/dashboard/sponsor?error=role');
  const title = String(form.get('title') || '').trim().slice(0, 100);
  const description = String(form.get('description') || '').trim().slice(0, 4000);
  const supportType = String(form.get('supportType') || '').trim().slice(0, 80);
  const country = String(form.get('country') || 'TG').trim().toUpperCase().slice(0, 2);
  const currency = String(form.get('currency') || 'XOF').trim().toUpperCase().slice(0, 3);
  const rawAmount = String(form.get('amount') || '').trim();
  const rawDeadline = String(form.get('deadline') || '').trim();
  const amount = rawAmount ? Number(rawAmount) : null;
  const deadline = rawDeadline ? new Date(`${rawDeadline}T23:59:59`) : null;
  if (title.length < 5 || description.length < 40 || supportType.length < 3 || !/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)) redirect('/dashboard/sponsor?error=fields');
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 100000000000)) redirect('/dashboard/sponsor?error=amount');
  if (deadline && (Number.isNaN(deadline.getTime()) || deadline <= new Date())) redirect('/dashboard/sponsor?error=deadline');
  await prisma.sponsorOpportunity.create({ data: { ownerId: user.id, title, description, supportType, country, currency, amount, deadline, status: 'PENDING_REVIEW', isVerified: false } });
  revalidatePath('/dashboard/sponsor');
  redirect('/dashboard/sponsor?submitted=1');
}

export async function applyToSponsorOpportunity(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const opportunityId = String(form.get('opportunityId') || '');
  const message = String(form.get('message') || '').trim().slice(0, 1200);
  const opportunity = await prisma.sponsorOpportunity.findFirst({ where: { id: opportunityId, status: 'PUBLISHED', isVerified: true, OR: [{ deadline: null }, { deadline: { gt: new Date() } }] }, select: { id: true } });
  if (!opportunity) redirect('/dashboard/sponsor/opportunities?error=closed');
  await prisma.sponsorApplication.upsert({ where: { opportunityId_modelId: { opportunityId, modelId: user.modelProfile.id } }, update: { message: message || null, status: 'SUBMITTED' }, create: { opportunityId, modelId: user.modelProfile.id, message: message || null } });
  revalidatePath('/dashboard/sponsor/opportunities');
  redirect('/dashboard/sponsor/opportunities?applied=1');
}

export async function moderateSponsorOpportunity(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.roles.some(r => r.role === 'ADMIN')) redirect('/dashboard');
  const id = String(form.get('id') || '');
  const decision = String(form.get('decision') || '');
  if (!id || !['approve', 'reject'].includes(decision)) redirect('/dashboard/admin?error=fields');
  await prisma.sponsorOpportunity.update({ where: { id }, data: decision === 'approve' ? { status: 'PUBLISHED', isVerified: true } : { status: 'CANCELLED', isVerified: false } });
  revalidatePath('/dashboard/admin'); revalidatePath('/dashboard/sponsor/opportunities');
  redirect('/dashboard/admin?moderated=1');
}

export async function grantProfessionalRole(form: FormData) {
  const admin = await getCurrentUser();
  if (!admin?.roles.some(r => r.role === 'ADMIN')) redirect('/dashboard');
  const email = String(form.get('email') || '').trim().toLowerCase();
  const role = String(form.get('role') || '');
  const allowed = new Set(['AGENCY', 'BRAND', 'SPONSOR', 'PHOTOGRAPHER', 'ORGANIZER', 'TRAINER']);
  if (!email.includes('@') || !allowed.has(role)) redirect('/dashboard/admin?error=role-fields');
  const target = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!target) redirect('/dashboard/admin?error=user-not-found');
  await prisma.userRole.upsert({ where: { userId_role: { userId: target.id, role: role as any } }, update: {}, create: { userId: target.id, role: role as any } });
  revalidatePath('/dashboard/admin');
  redirect('/dashboard/admin?roleGranted=1');
}

export async function updateSponsorApplication(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const id = String(form.get('applicationId') || '');
  const status = String(form.get('status') || '');
  const allowed = new Set(['SUBMITTED','REVIEWING','SHORTLISTED','ACCEPTED','REJECTED']);
  if (!allowed.has(status)) redirect('/dashboard/sponsor?error=status');
  const application = await prisma.sponsorApplication.findUnique({ where: { id }, include: { opportunity: true, model: { select: { userId: true } } } });
  if (!application || (application.opportunity.ownerId !== user.id && !user.roles.some(r => r.role === 'ADMIN'))) redirect('/dashboard/sponsor?error=forbidden');
  const changed = application.status !== status;
  await prisma.sponsorApplication.update({ where: { id }, data: { status: status as any } });
  if (changed) await prisma.notification.create({ data: { userId: application.model.userId, title: 'Mise à jour de votre demande de soutien', message: `Votre demande pour « ${application.opportunity.title} » est désormais ${status}.` } });
  revalidatePath('/dashboard/sponsor');
  redirect('/dashboard/sponsor?updated=1');
}
