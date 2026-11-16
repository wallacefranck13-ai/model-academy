import Link from 'next/link';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';
import { enrollInCourse } from '@/app/actions/learning';

export default async function SchoolPage() {
  const user = await getCurrentUser();
  const courses = await prisma.course.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'asc' }, include: { lessons: { select: { id: true } }, enrollments: { where: { modelId: user?.modelProfile?.id ?? '__none__' }, include: { progress: true } } } });
  return <>
    <div className="eyebrow">MODEL SCHOOL · FORMATION PROFESSIONNELLE</div>
    <h1 className="serif" style={{fontSize:44,fontWeight:500}}>L’école du métier.</h1>
    <p className="muted">Apprends à ton rythme, suis ta progression et construis une carrière durable.</p>
    {!user && <p className="muted">Connecte-toi pour enregistrer ta progression et obtenir tes attestations.</p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:15,marginTop:28}}>
      {courses.map((course) => { const enrollment = course.enrollments[0]; const done = enrollment?.progress.filter(p=>p.completed).length ?? 0; const total = course.lessons.length; const pct = total ? Math.round(done/total*100) : 0; return <article className="card" key={course.id} style={{padding:24}}><div className="eyebrow">{course.category} · {course.level}</div><h2 className="serif" style={{fontSize:26,fontWeight:500}}>{course.title}</h2><p className="muted" style={{fontSize:13,lineHeight:1.7}}>{course.description}</p><div style={{display:'flex',justifyContent:'space-between',fontSize:11,margin:'18px 0 8px'}}><span>{total} leçon(s)</span><span>{enrollment ? `${pct}% terminé` : 'Nouveau parcours'}</span></div><div style={{height:4,background:'#e7e0d4'}}><div style={{height:4,width:`${pct}%`,background:'#b99a63'}}/></div><div style={{marginTop:20}}>{enrollment ? <Link className="button" href={`/dashboard/school/${course.slug}`}>Continuer le cours →</Link> : <form action={enrollInCourse}><input type="hidden" name="courseId" value={course.id}/><button className="button" type="submit">Commencer le cours →</button></form>}</div></article> })}
      {courses.length===0 && <div className="card" style={{padding:24}}><h2 className="serif">Les premiers cours arrivent.</h2><p className="muted">Le catalogue sera visible dès que les cours auront été publiés par l’équipe pédagogique.</p></div>}
    </div>
  </>;
}
