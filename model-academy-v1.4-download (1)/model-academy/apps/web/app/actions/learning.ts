'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export async function enrollInCourse(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const courseId = String(form.get('courseId') ?? '');
  const course = await prisma.course.findFirst({ where: { id: courseId, isPublished: true }, select: { id: true, slug: true } });
  if (!course) redirect('/dashboard/school?error=course');
  await prisma.enrollment.upsert({ where: { modelId_courseId: { modelId: user.modelProfile.id, courseId } }, update: {}, create: { modelId: user.modelProfile.id, courseId } });
  revalidatePath('/dashboard/school');
  redirect(`/dashboard/school/${course.slug}`);
}

export async function completeLesson(form: FormData) {
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const lessonId = String(form.get('lessonId') ?? '');
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { id: true, slug: true } } } });
  if (!lesson) redirect('/dashboard/school');
  const enrollment = await prisma.enrollment.findUnique({ where: { modelId_courseId: { modelId: user.modelProfile.id, courseId: lesson.course.id } } });
  if (!enrollment) redirect('/dashboard/school');
  await prisma.lessonProgress.upsert({ where: { lessonId_enrollmentId: { lessonId, enrollmentId: enrollment.id } }, update: { completed: true, completedAt: new Date() }, create: { lessonId, enrollmentId: enrollment.id, completed: true, completedAt: new Date() } });
  const remaining = await prisma.lesson.count({ where: { courseId: lesson.course.id, progress: { none: { enrollmentId: enrollment.id, completed: true } } } });
  if (remaining === 0) await prisma.enrollment.update({ where: { id: enrollment.id }, data: { completedAt: new Date() } });
  revalidatePath(`/dashboard/school/${lesson.course.slug}`);
}
