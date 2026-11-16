import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';
import { ContractResponse } from './contract-response';
const money=(n:unknown)=>`${Number(n).toLocaleString('fr-FR')} FCFA`;
export default async function ContractsPage(){
 const user=await getCurrentUser(); if(!user) redirect('/sign-in');
 const profile=await prisma.modelProfile.findUnique({where:{userId:user.id}});
 const items=profile?await prisma.contract.findMany({where:{modelId:profile.id},orderBy:{createdAt:'desc'}}):[];
 return <div><div className="eyebrow">CARRIÈRE · DOCUMENTS</div><h1 className="serif" style={{fontSize:44,fontWeight:500}}>Mes contrats</h1><p className="muted">Retrouve ici les propositions et contrats associés à ton profil.</p>
 {items.length===0?<section className="card" style={{padding:28,marginTop:24}}><h2 className="serif" style={{fontSize:26,fontWeight:500}}>Aucun contrat pour le moment</h2><p className="muted" style={{fontSize:13}}>Lorsqu’un contrat sera enregistré à ton nom, ses informations apparaîtront dans cet espace.</p></section>:<div style={{display:'grid',gap:12,marginTop:22}}>{items.map(c=><article className="card" key={c.id} style={{padding:22}}><div className="eyebrow">{{PROPOSED:'PROPOSITION À EXAMINER',PENDING:'EN ATTENTE',SENT:'TRANSMIS',ACCEPTED_PENDING_SIGNATURE:'ACCEPTÉ · SIGNATURE À FINALISER',DECLINED:'REFUSÉ',SIGNED:'SIGNÉ'}[c.status] || c.status}</div><h2 className="serif" style={{fontSize:25,fontWeight:500}}>{c.title}</h2><p style={{fontWeight:600}}>{money(c.amount)} · {c.currency}</p><p className="muted" style={{fontSize:11}}>Créé le {c.createdAt.toLocaleDateString('fr-FR')} {c.signedAt?`· Signé le ${c.signedAt.toLocaleDateString('fr-FR')}`:'· Signature non enregistrée'}</p>{['PROPOSED','PENDING','SENT'].includes(c.status) && <ContractResponse id={c.id} />}</article>)}</div>}
 <p className="muted" style={{fontSize:11,marginTop:18}}>Cet espace est un registre de suivi. La présence d’un document ou d’un statut ne remplace pas la vérification juridique et la signature des parties.</p></div>;
}
