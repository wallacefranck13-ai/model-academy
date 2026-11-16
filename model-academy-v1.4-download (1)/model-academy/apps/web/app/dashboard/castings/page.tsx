import Link from 'next/link';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

const money = (v: any, currency: string) => v == null ? 'Rémunération à préciser' : `${Number(v).toLocaleString('fr-FR')} ${currency}`;
export default async function CastingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const castings = await prisma.casting.findMany({ where: { status: 'PUBLISHED', isVerified: true, OR: [{ deadline: null }, { deadline: { gte: new Date() } }] }, orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }], take: 50, include: { applications: { where: { modelId: user.modelProfile?.id ?? '__none__' }, select: { status: true } } } });
  return <>
    <div className="eyebrow">CAREER OPPORTUNITIES · MODEL CASTING</div>
    <h1 className="serif" style={{fontSize:44,fontWeight:500}}>Les opportunités commencent ici.</h1>
    <p className="muted">Des annonces contrôlées avant publication. Lis le brief, vérifie les conditions et candidate en toute confiance.</p>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',margin:'24px 0'}}><span className="eyebrow">{castings.length} OPPORTUNITÉ(S) PUBLIÉE(S)</span><Link className="btn" href="/dashboard/recruiter">Espace recruteur</Link></div>
    {castings.length === 0 ? <section className="card" style={{padding:30,marginTop:20}}><div className="eyebrow">LOMÉ · TOGO</div><h2 className="serif" style={{fontSize:28,fontWeight:500}}>Prépare ton prochain casting.</h2><p className="muted">Aucune annonce vérifiée n’est actuellement disponible. Reviens consulter cette page : les annonces apparaîtront après validation de l’équipe MODEL ACADEMY.</p><p className="muted" style={{fontSize:12}}>Conseil : garde ton portfolio à jour et ne verse jamais de frais à un recruteur non vérifié pour obtenir un rôle.</p></section> : <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:16}}>{castings.map((c:any)=><article className="card" key={c.id} style={{padding:22,display:'flex',flexDirection:'column',gap:10}}><div className="eyebrow">{c.country}{c.city ? ` · ${c.city}` : ''} · <span style={{color:'#927342'}}>RECRUTEUR VÉRIFIÉ</span></div><h2 className="serif" style={{fontSize:25,fontWeight:500,margin:0}}>{c.title}</h2><p className="muted" style={{fontSize:13,margin:0}}>{c.description.slice(0,190)}{c.description.length>190?'…':''}</p><div style={{fontSize:12,marginTop:5}}><strong>{money(c.budget,c.currency)}</strong></div><div className="muted" style={{fontSize:11}}>Date limite : {c.deadline ? new Date(c.deadline).toLocaleDateString('fr-FR') : 'Non précisée'}</div>{c.applications.length>0 && <span className="eyebrow">CANDIDATURE : {c.applications[0].status}</span>}<Link className="btn" href={`/dashboard/castings/${c.id}`} style={{marginTop:'auto',textAlign:'center'}}>Consulter le brief</Link></article>)}</div>}
  </>;
}
