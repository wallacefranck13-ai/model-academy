import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    orderBy: { updatedAt: 'desc' },
    include: {
      userA: { select: { id: true, fullName: true } },
      userB: { select: { id: true, fullName: true } },
      castingApplication: { include: { casting: { select: { title: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, createdAt: true, senderId: true } },
      _count: { select: { messages: true } },
    },
  });
  return <><div className="eyebrow">MODEL ACADEMY · MESSAGERIE</div><h1 className="serif" style={{fontSize:42,fontWeight:500}}>Conversations professionnelles.</h1><p className="muted">Échangez à propos des castings et collaborations depuis un espace privé. Ne partagez jamais de documents sensibles ou de codes de paiement.</p>
  <div style={{display:'grid',gap:10,marginTop:24}}>{conversations.length===0?<section className="card" style={{padding:28}}><h2 className="serif" style={{fontSize:25,fontWeight:500}}>Aucun échange pour le moment.</h2><p className="muted">Une conversation apparaîtra lorsqu’un recruteur ou un mannequin ouvrira un échange lié à une candidature.</p><Link className="btn" href="/dashboard/castings">Explorer les castings</Link></section>:conversations.map(c=>{const other=c.userAId===user.id?c.userB:c.userA;const last=c.messages[0];return <Link key={c.id} href={`/dashboard/messages/${c.id}`} className="card" style={{padding:18,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><div><div className="eyebrow">{c.castingApplication?.casting.title||'Échange professionnel'}</div><strong>{other.fullName}</strong><p className="muted" style={{fontSize:12,margin:'6px 0 0'}}>{last?last.body.slice(0,120):'Démarrer la conversation'}</p></div><div className="muted" style={{fontSize:10,textAlign:'right'}}>{last?new Date(last.createdAt).toLocaleDateString('fr-FR'):''}<small style={{display:'block'}}>{c._count.messages} message(s)</small></div></Link>})}</div></>;
}
