import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';
import { markAllNotificationsRead, markNotificationRead } from '@/app/actions/notifications';

export default async function NotificationsPage() {
  const user=await getCurrentUser(); if(!user) redirect('/sign-in');
  const [items,unread]=await Promise.all([
    prisma.notification.findMany({where:{userId:user.id},orderBy:{createdAt:'desc'},take:100}),
    prisma.notification.count({where:{userId:user.id,readAt:null}}),
  ]);
  return <><div className="eyebrow">MODEL ACADEMY · CENTRE DE NOTIFICATIONS</div><h1 className="serif" style={{fontSize:42,fontWeight:500}}>Vos actualités.</h1><p className="muted">Retrouvez ici les informations liées à vos candidatures, vos messages et votre activité professionnelle.</p><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',margin:'22px 0'}}><span className="eyebrow">{unread} NON LUE(S)</span>{unread>0&&<form action={markAllNotificationsRead}><button className="btn" type="submit">Tout marquer comme lu</button></form>}</div>
  {items.length===0?<section className="card" style={{padding:26}}><h2 className="serif" style={{fontSize:25,fontWeight:500}}>Tout est calme pour le moment.</h2><p className="muted">Les nouvelles notifications apparaîtront ici.</p></section>:<div style={{display:'grid',gap:9}}>{items.map(n=><article key={n.id} className="card" style={{padding:17,borderLeft:n.readAt?'1px solid #e7e0d4':'3px solid #b99a63'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}><div><div className="eyebrow">{n.readAt?'NOTIFICATION':'NOUVEAU'}</div><strong style={{display:'block',marginTop:6}}>{n.title}</strong><p className="muted" style={{fontSize:12,lineHeight:1.65,whiteSpace:'pre-wrap'}}>{n.message}</p><small className="muted">{new Date(n.createdAt).toLocaleString('fr-FR')}</small></div>{!n.readAt&&<form action={markNotificationRead}><input type="hidden" name="notificationId" value={n.id}/><button type="submit" style={{background:'#fffdf9',border:'1px solid #ddd3c4',padding:'8px 10px',fontSize:10,whiteSpace:'nowrap'}}>Marquer lu</button></form>}</div></article>)}</div>}</>;
}
