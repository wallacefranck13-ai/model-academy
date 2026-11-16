'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

const recruiterRoles = new Set(['AGENCY', 'BRAND', 'PHOTOGRAPHER', 'ORGANIZER']);

export async function applyToCasting(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const castingId = String(form.get('castingId') || '');
  const message = String(form.get('message') || '').trim().slice(0, 1200);
  const casting = await prisma.casting.findFirst({ where: { id: castingId, status: 'PUBLISHED', isVerified: true, OR: [{ deadline: null }, { deadline: { gt: new Date() } }] }, select: { id: true } });
  if (!casting) redirect('/dashboard/castings?error=unavailable');
  const existing = await prisma.castingApplication.findUnique({ where: { castingId_modelId: { castingId, modelId: user.modelProfile.id } } });
  await prisma.castingApplication.upsert({
    where: { castingId_modelId: { castingId, modelId: user.modelProfile.id } },
    update: { message: message || null, status: 'SUBMITTED' },
    create: { castingId, modelId: user.modelProfile.id, message: message || null },
  });
  if (!existing) {
    const owner = await prisma.casting.findUnique({ where: { id: castingId }, select: { ownerId: true, title: true } });
    if (owner) await prisma.notification.create({ data: { userId: owner.ownerId, title: 'Nouvelle candidature', message: `Une nouvelle candidature a été reçue pour « ${owner.title} ».` } });
  }
  revalidatePath('/dashboard/castings');
  revalidatePath(`/dashboard/castings/${castingId}`);
  redirect(`/dashboard/castings/${castingId}?applied=1`);
}

export async function withdrawApplication(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const castingId = String(form.get('castingId') || '');
  await prisma.castingApplication.updateMany({ where: { castingId, modelId: user.modelProfile.id, status: { in: ['SUBMITTED', 'REVIEWING'] } }, data: { status: 'WITHDRAWN' } });
  revalidatePath(`/dashboard/castings/${castingId}`);
  redirect(`/dashboard/castings/${castingId}?withdrawn=1`);
}

export async function createCasting(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user.roles.some((r) => recruiterRoles.has(r.role))) redirect('/dashboard/recruiter?error=role');
  const title = String(form.get('title') || '').trim().slice(0, 100);
  const description = String(form.get('description') || '').trim().slice(0, 5000);
  const requirements = String(form.get('requirements') || '').trim().slice(0, 2000);
  const usageRights = String(form.get('usageRights') || '').trim().slice(0, 2000);
  const compensationType = String(form.get('compensationType') || 'A négocier').slice(0, 60);
  const country = String(form.get('country') || 'TG').trim().slice(0, 2).toUpperCase();
  const city = String(form.get('city') || '').trim().slice(0, 80);
  const currency = String(form.get('currency') || 'XOF').trim().slice(0, 3).toUpperCase();
  const rawBudget = String(form.get('budget') || '').trim();
  const rawDeadline = String(form.get('deadline') || '').trim();
  if (title.length < 5 || description.length < 40 || !/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)) redirect('/dashboard/recruiter?error=fields');
  const budget = rawBudget ? Number(rawBudget) : null;
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 100000000000)) redirect('/dashboard/recruiter?error=budget');
  const deadline = rawDeadline ? new Date(`${rawDeadline}T23:59:59`) : null;
  if (deadline && (Number.isNaN(deadline.getTime()) || deadline <= new Date())) redirect('/dashboard/recruiter?error=deadline');
  await prisma.casting.create({ data: { ownerId: user.id, title, description, requirements: requirements || null, usageRights: usageRights || null, compensationType, country, city: city || null, currency, budget: budget === null ? null : budget, deadline, status: 'PENDING_REVIEW', isVerified: false } });
  revalidatePath('/dashboard/recruiter');
  redirect('/dashboard/recruiter?submitted=1');
}

const applicationStatuses = new Set(['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INVITED', 'ACCEPTED', 'REJECTED']);
export async function updateCastingApplication(form: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const applicationId = String(form.get('applicationId') || '');
  const status = String(form.get('status') || '');
  if (!applicationStatuses.has(status)) redirect('/dashboard/recruiter?error=status');
  const application = await prisma.castingApplication.findUnique({ where: { id: applicationId }, include: { casting: true, model: { select: { userId: true } } } });
  if (!application || (application.casting.ownerId !== user.id && !user.roles.some(r => r.role === 'ADMIN'))) redirect('/dashboard/recruiter?error=forbidden');
  const changed = application.status !== status;
  await prisma.castingApplication.update({ where: { id: applicationId }, data: { status: status as any } });
  if (changed) await prisma.notification.create({ data: { userId: application.model.userId, title: 'Mise à jour de candidature', message: `Le statut de votre candidature pour « ${application.casting.title} » est désormais ${status}.` } });
  revalidatePath('/dashboard/recruiter');
  revalidatePath('/dashboard/admin');
  redirect('/dashboard/recruiter?updated=1');
}

export async function moderateCasting(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.roles.some(r => r.role === 'ADMIN')) redirect('/dashboard');
  const id = String(form.get('id') || '');
  const decision = String(form.get('decision') || '');
  if (!id || !['approve', 'reject'].includes(decision)) redirect('/dashboard/admin?error=fields');
  await prisma.casting.update({ where: { id }, data: decision === 'approve' ? { status: 'PUBLISHED', isVerified: true } : { status: 'CANCELLED', isVerified: false } });
  revalidatePath('/dashboard/admin'); revalidatePath('/dashboard/castings'); revalidatePath('/dashboard/recruiter');
  redirect('/dashboard/admin?moderated=1');
}
