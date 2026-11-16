'use client';

import { FormEvent, useState } from 'react';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const suggestions = [
  'Aide-moi à améliorer ma démarche de mannequin.',
  'Prépare-moi à un casting commercial.',
  'Donne-moi un programme de posing sur 7 jours.',
  'Comment construire un portfolio professionnel ?',
];

export default function CoachChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis MODEL AI, ton coach personnel. Sur quelle compétence veux-tu progresser aujourd’hui : démarche, posture, posing, expression ou préparation aux castings ?' },
  ]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setInput('');
    setError('');
    setMessages((items) => [...items, { role: 'user', content: value }]);
    setBusy(true);
    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: value, conversationId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Impossible de contacter le coach.');
      setConversationId(data.conversationId);
      setMessages((items) => [...items, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <div className="coach-layout">
      <section className="coach-chat card">
        <div className="coach-chat-head">
          <div><div className="eyebrow">MODEL AI · COACHING PERSONNEL</div><h2 className="serif" style={{fontSize:27,fontWeight:500,margin:'8px 0 0'}}>Ta prochaine progression commence ici.</h2></div>
          <span className="coach-online"><i /> COACH</span>
        </div>
        <div className="coach-messages" aria-live="polite">
          {messages.map((message, index) => (
            <div className={`coach-message ${message.role}`} key={index}>
              <small>{message.role === 'assistant' ? 'MODEL AI' : 'VOUS'}</small>
              <p>{message.content}</p>
            </div>
          ))}
          {busy && <div className="coach-message assistant"><small>MODEL AI</small><p>Je prépare tes conseils…</p></div>}
        </div>
        {error && <p className="coach-error" role="alert">{error}</p>}
        <div className="coach-suggestions">
          {suggestions.map((item) => <button key={item} type="button" onClick={() => void send(item)} disabled={busy}>{item}</button>)}
        </div>
        <form className="coach-form" onSubmit={submit}>
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={4000} placeholder="Pose une question à ton coach…" aria-label="Message pour MODEL AI" />
          <button className="btn" disabled={busy || !input.trim()} type="submit">{busy ? 'ENVOI…' : 'ENVOYER'}</button>
        </form>
        <p className="coach-disclaimer">Les conseils sont pédagogiques et ne remplacent pas l’encadrement d’un professionnel. L’analyse vidéo n’est pas encore activée.</p>
      </section>
      <aside className="coach-side">
        <div className="card coach-side-card"><div className="eyebrow">TES AXES DE TRAVAIL</div><h3 className="serif">Les fondamentaux</h3>{['Posture et équilibre','Démarche et coordination','Posing et expression','Préparation casting','Image et carrière'].map((x,i)=><div className="coach-focus" key={x}><span>0{i+1}</span>{x}</div>)}</div>
        <div className="coach-note"><div className="eyebrow">CONSEIL DU COACH</div><p>La régularité compte davantage qu’une séance parfaite. Entraîne-toi progressivement, filme tes exercices uniquement si tu le souhaites, puis observe tes progrès.</p></div>
      </aside>
    </div>
  );
}
