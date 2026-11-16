import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';
import { BookingResponse } from './booking-response';
export default async function BookingsPage(){
 const user=await getCurrentUser(); if(!user) redirect('/sign-in');
 const profile=await prisma.modelProfile.findUnique({where:{userId:user.id}});
 const items=profile?await prisma.booking.findMany({where:{modelId:profile.id},orderBy:{startAt:'asc'},take:100}):[];
 return <div><div className="eyebrow">CARRIÈRE · PLANNING</div><h1 className="serif" style={{fontSize:44,fontWeight:500}}>Mes réservations</h1><p className="muted">Séances photo, rendez-vous, événements et engagements professionnels.</p>
 {items.length===0?<section className="card" style={{padding:28,marginTop:24}}><h2 className="serif" style={{fontSize:26,fontWeight:500}}>Ton agenda est libre</h2><p className="muted" style={{fontSize:13}}>Les réservations confirmées ou proposées par les équipes apparaîtront ici.</p></section>:<div style={{display:'grid',gap:12,marginTop:22}}>{items.map(b=><article className="card" key={b.id} style={{padding:22}}><div className="eyebrow">{{PROPOSED:'PROPOSITION À CONFIRMER',PENDING:'EN ATTENTE',CONFIRMED:'CONFIRMÉE',DECLINED:'REFUSÉE',CANCELLED:'ANNULÉE',COMPLETED:'TERMINÉE'}[b.status] || b.status}</div><h2 className="serif" style={{fontSize:25,fontWeight:500}}>{b.title}</h2><p>{b.startAt.toLocaleString('fr-FR')} {b.endAt?`— ${b.endAt.toLocaleString('fr-FR')}`:''}</p><p className="muted" style={{fontSize:12}}>{b.location||'Lieu à confirmer'}</p>{['PROPOSED','PENDING'].includes(b.status) && <BookingResponse id={b.id} />}</article>)}</div>}</div>;
}
