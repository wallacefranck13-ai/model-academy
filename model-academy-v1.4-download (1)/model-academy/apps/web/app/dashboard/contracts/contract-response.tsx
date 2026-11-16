'use client';
import { useState, useTransition } from 'react';
import { respondToContract } from '@/app/actions/career';
export function ContractResponse({ id }: { id: string }) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const act = (decision: 'accept' | 'decline') => startTransition(async () => { const result = await respondToContract(id, decision); setMessage(result.message); });
  return <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
    <button disabled={pending} onClick={()=>act('accept')} style={{background:'#b99a63',border:0,padding:'10px 14px',fontSize:11,fontWeight:700,cursor:'pointer'}}>ACCEPTER LA PROPOSITION</button>
    <button disabled={pending} onClick={()=>act('decline')} style={{background:'transparent',border:'1px solid #c9bda9',padding:'10px 14px',fontSize:11,cursor:'pointer'}}>REFUSER</button>
    {message && <p role="status" style={{width:'100%',fontSize:12}}>{message}</p>}
  </div>;
}
