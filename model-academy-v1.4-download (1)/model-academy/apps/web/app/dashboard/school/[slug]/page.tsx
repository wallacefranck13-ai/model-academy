import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';
import { completeLesson } from '@/app/actions/learning';

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const course = await prisma.course.findFirst({ where: { slug, isPublished: true }, include: { lessons: { orderBy: { position: 'asc' }, include: { progress: { where: { enrollment: { modelId: user.modelProfile.id } } } } }, enrollments: { where: { modelId: user.modelProfile.id } } } });
  if (!course) notFound();
  const enrollment = course.enrollments[0];
  if (!enrollment) redirect('/dashboard/school');
  const completed = course.lessons.filter(l=>l.progress.some(p=>p.completed)).length;
  return <><Link href="/dashboard/school" className="eyebrow">← RETOUR À L’ÉCOLE</Link><div className="eyebrow" style={{marginTop:24}}>{course.category} · {course.level}</div><h1 className="serif" style={{fontSize:42,fontWeight:500}}>{course.title}</h1><p className="muted">{course.description}</p><p className="eyebrow" style={{marginTop:24}}>{completed} / {course.lessons.length} LEÇONS TERMINÉES</p>
    <div style={{display:'grid',gap:12,marginTop:20}}>{course.lessons.map((lesson,index)=>{const done=lesson.progress.some(p=>p.completed);return <article className="card" key={lesson.id} style={{padding:22,display:'flex',alignItems:'center',justifyContent:'space-between',gap:18}}><div><div className="eyebrow">LEÇON {String(index+1).padStart(2,'0')} {done?'· TERMINÉE':''}</div><h2 className="serif" style={{fontSize:23,fontWeight:500,margin:'8px 0'}}>{lesson.title}</h2>{lesson.content && <p className="muted" style={{fontSize:13,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{lesson.content}</p>}{lesson.duration && <small className="muted">{lesson.duration} min</small>}</div>{!done && <form action={completeLesson}><input type="hidden" name="lessonId" value={lesson.id}/><button className="button" type="submit">Marquer terminée</button></form>}</article>})}</div>
    {course.lessons.length===0 && <p className="muted">Les leçons de ce parcours seront publiées prochainement.</p>}
  </>;
}
