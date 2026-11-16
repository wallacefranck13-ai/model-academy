import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

const money = (n: unknown) => `${Number(n).toLocaleString('fr-FR')} FCFA`;
const statusLabel: Record<string,string> = { TRIALING:'Essai', ACTIVE:'Actif', PAST_DUE:'Paiement en retard', CANCELLED:'Résilié', EXPIRED:'Expiré', PENDING:'En attente', SUCCESS:'Réussi', FAILED:'Échoué', REFUNDED:'Remboursé' };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const [plans, subscriptions, payments] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: [{ price: 'asc' }, { interval: 'asc' }] }),
    prisma.subscription.findMany({ where: { userId: user.id }, include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);
  const current = subscriptions.find(s => ['ACTIVE','TRIALING','PAST_DUE'].includes(s.status));
  return <div>
    <div className="eyebrow">ESPACE MEMBRE · FACTURATION</div>
    <h1 className="serif" style={{fontSize:44,fontWeight:500}}>Abonnement & paiements</h1>
    <p className="muted">Choisis le niveau d’accompagnement adapté à tes ambitions.</p>
    <section className="card" style={{padding:24,marginTop:24}}>
      <div className="eyebrow">MON ABONNEMENT</div>
      {current ? <><h2 className="serif" style={{fontSize:28,fontWeight:500}}>{current.plan.name}</h2><p>{statusLabel[current.status] || current.status} · {money(current.plan.price)} / {current.plan.interval === 'YEAR' ? 'an' : 'mois'}</p><p className="muted" style={{fontSize:12}}>Depuis le {current.startsAt.toLocaleDateString('fr-FR')}{current.endsAt ? ` · échéance ${current.endsAt.toLocaleDateString('fr-FR')}` : ''}</p></> : <><h2 className="serif" style={{fontSize:26,fontWeight:500}}>Starter</h2><p className="muted">Aucun abonnement payant actif sur ce compte.</p></>}
    </section>
    <h2 className="serif" style={{fontSize:30,fontWeight:500,marginTop:34}}>Les formules</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:14}}>
      {plans.map(plan => <article className="card" key={plan.id} style={{padding:22}}>
        <div className="eyebrow">{plan.interval === 'YEAR' ? 'ENGAGEMENT ANNUEL' : 'SANS ENGAGEMENT ANNUEL'}</div>
        <h3 className="serif" style={{fontSize:25,fontWeight:500}}>{plan.name}</h3>
        <p style={{fontSize:22,fontWeight:600}}>{money(plan.price)}<span className="muted" style={{fontSize:11,fontWeight:400}}> / {plan.interval === 'YEAR' ? 'an' : 'mois'}</span></p>
        <ul style={{paddingLeft:18,fontSize:12,lineHeight:2}}>{(Array.isArray(plan.features) ? plan.features : []).map((f:any,i:number)=><li key={i}>{String(f)}</li>)}</ul>
        <div style={{borderTop:'1px solid #e7e0d4',paddingTop:12,marginTop:14,fontSize:11,color:'#8a6d3b'}}>Paiement bientôt disponible</div>
      </article>)}
      {plans.length === 0 && <p className="muted">Les formules seront affichées après initialisation du catalogue.</p>}
    </div>
    <section style={{marginTop:28}} className="card">
      <div className="eyebrow">MOYENS DE PAIEMENT</div><h2 className="serif" style={{fontSize:25,fontWeight:500}}>Disponibilité des paiements</h2>
      <p className="muted" style={{fontSize:13}}>Les intégrations opérateurs nécessitent les accès marchands et les paramètres techniques officiels. Aucun débit ne peut être initié depuis cette page pour le moment.</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:9}}>{['Mixx by Yas','TMoney','Flooz','Carte bancaire'].map(x=><span key={x} style={{border:'1px solid #ddd3c2',padding:'8px 12px',fontSize:11}}> {x} · En configuration</span>)}</div>
    </section>
    <h2 className="serif" style={{fontSize:28,fontWeight:500,marginTop:34}}>Historique des paiements</h2>
    <div className="card" style={{padding:20,overflowX:'auto'}}>
      {payments.length ? <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}><thead><tr><th align="left">Date</th><th align="left">Moyen</th><th align="left">Référence</th><th align="right">Montant</th><th align="right">Statut</th></tr></thead><tbody>{payments.map(p=><tr key={p.id} style={{borderTop:'1px solid #e7e0d4'}}><td style={{padding:'12px 4px'}}>{p.createdAt.toLocaleDateString('fr-FR')}</td><td>{p.provider}</td><td>{p.providerRef || '—'}</td><td align="right">{money(p.amount)}</td><td align="right">{statusLabel[p.status] || p.status}</td></tr>)}</tbody></table> : <p className="muted" style={{fontSize:12}}>Aucun paiement enregistré.</p>}
    </div>
    <p className="muted" style={{fontSize:11,marginTop:14}}>Les montants et statuts affichés proviennent des enregistrements de la plateforme. La page ne simule ni transaction ni activation d’abonnement.</p>
  </div>;
}
