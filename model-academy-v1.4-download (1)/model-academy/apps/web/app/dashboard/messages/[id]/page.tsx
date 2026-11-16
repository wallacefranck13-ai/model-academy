import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';
import { sendMessage } from '@/app/actions/messaging';

export default async function ConversationPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string}>}) {
  const {id}=await params; const query=await searchParams; const user=await getCurrentUser(); if(!user) redirect('/sign-in');
  const conversation=await prisma.conversation.findFirst({where:{id,OR:[{userAId:user.id},{userBId:user.id}]},include:{userA:{select:{id:true,fullName:true}},userB:{select:{id:true,fullName:true}},castingApplication:{include:{casting:{select:{title:true}}}},messages:{orderBy:{createdAt:'desc'},include:{sender:{select:{fullName:true}}},take:150}}});
  if(!conversation) notFound();
  conversation.messages.reverse();
  await prisma.message.updateMany({where:{conversationId:id,senderId:{not:user.id},readAt:null},data:{readAt:new Date()}});
  const other=conversation.userAId===user.id?conversation.userB:conversation.userA;
  return <><Link href="/dashboard/messages" className="muted" style={{fontSize:12}}>← Toutes les conversations</Link><div className="eyebrow" style={{marginTop:24}}>ÉCHANGE PRIVÉ · {conversation.castingApplication?.casting.title||'COLLABORATION'}</div><h1 className="serif" style={{fontSize:38,fontWeight:500}}>{other.fullName}</h1><p className="muted" style={{fontSize:12}}>Restez dans la plateforme pour vos échanges. Les paiements et contrats doivent être confirmés par des canaux officiels.</p>
  <section className="card" style={{padding:20,marginTop:20,display:'grid',gap:12}}>{conversation.messages.length===0?<p className="muted">Commencez la conversation par un message professionnel.</p>:conversation.messages.map(m=><div key={m.id} style={{justifySelf:m.senderId===user.id?'end':'start',maxWidth:'85%',padding:14,background:m.senderId===user.id?'#171614':'#f4efe6',color:m.senderId===user.id?'#fff':'#25221d',border:'1px solid #e7e0d4'}}><div style={{fontSize:9,letterSpacing:'.12em',color:m.senderId===user.id?'#c5a977':'#8a7859'}}>{m.senderId===user.id?'VOUS':m.sender.fullName} · {new Date(m.createdAt).toLocaleString('fr-FR')}</div><p style={{whiteSpace:'pre-wrap',fontSize:13,lineHeight:1.65,margin:'8px 0 0'}}>{m.body}</p></div>)}
  {query.error==='rate'&&<p className='muted' style={{fontSize:12}}>Limite temporaire atteinte : 30 messages par heure. Réessayez plus tard.</p>}<form action={sendMessage} style={{display:'grid',gap:10,borderTop:'1px solid #e7e0d4',paddingTop:18}}><input type="hidden" name="conversationId" value={id}/><label className="eyebrow" htmlFor="message-body">NOUVEAU MESSAGE</label><textarea id="message-body" name="body" required minLength={1} maxLength={2000} rows={4} placeholder="Écrivez votre message…" style={{width:'100%',padding:12,border:'1px solid #ddd3c4',background:'#fffdf9',font:'inherit',fontSize:13}}/><button className="btn" type="submit">Envoyer le message</button></form></section></>;
}
