'use client';

import { FormEvent, useState } from 'react';

type Feedback = {
  summary?: string;
  visibleStrengths?: string[];
  improvements?: string[];
  exercises?: string[];
  confidenceNote?: string;
};

async function extractKeyFrames(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Impossible de lire cette vidéo sur cet appareil.'));
      video.load();
    });
    if (!Number.isFinite(video.duration) || video.duration < 1) {
      throw new Error('La vidéo doit durer au moins une seconde.');
    }

    const positions = [0.2, 0.5, 0.8].map((ratio) => Math.max(0, Math.min(video.duration - 0.08, video.duration * ratio)));
    const frames: string[] = [];
    for (const time of positions) {
      await new Promise<void>((resolve, reject) => {
        const onSeeked = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Impossible d’extraire une image de la vidéo.')); };
        const cleanup = () => { video.removeEventListener('seeked', onSeeked); video.removeEventListener('error', onError); };
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.currentTime = time;
      });
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 512 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Extraction vidéo non prise en charge par ce navigateur.');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.68));
    }
    return frames;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

export default function VisionUpload() {
  const [focus, setFocus] = useState('WALK');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem('video');
    const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] : undefined;
    if (!file) return;
    setBusy(true); setError(''); setMessage(''); setFeedback(null);
    try {
      setStage('Préparation des images clés…');
      const frames = await extractKeyFrames(file);
      const data = new FormData(form);
      data.set('focus', focus);
      data.set('consent', String(consent));

      setStage('Enregistrement sécurisé de la vidéo…');
      const response = await fetch('/api/coach/video', { method: 'POST', body: data });
      const uploaded = await response.json();
      if (!response.ok) throw new Error(uploaded.error || 'Envoi impossible.');

      setStage('Analyse des trois images clés…');
      const analysisResponse = await fetch('/api/coach/vision/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: uploaded.session.id, frames }),
      });
      const analysis = await analysisResponse.json();
      if (!analysisResponse.ok) {
        setMessage('Vidéo enregistrée. ' + (analysis.error || 'Le rapport sera disponible après configuration du moteur de vision.'));
      } else {
        setFeedback(analysis.feedback);
        setMessage('Analyse des images clés terminée. Consulte ton rapport ci-dessous.');
      }
      form.reset();
      setConsent(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
      setStage('');
    }
  }

  return <>
    <form className="vision-upload" onSubmit={submit}>
      <label className="vision-field"><span>AXE D’ENTRAÎNEMENT</span>
        <select value={focus} onChange={(e) => setFocus(e.target.value)}>
          <option value="WALK">Démarche et coordination</option>
          <option value="POSTURE">Posture et équilibre</option>
          <option value="POSING">Posing et transitions</option>
          <option value="EXPRESSION">Expression caméra</option>
          <option value="CASTING">Présentation casting</option>
        </select>
      </label>
      <label className="vision-file">
        <input name="video" type="file" accept="video/mp4,video/quicktime,video/webm" required />
        <span className="vision-file-icon">＋</span>
        <strong>Choisir une vidéo</strong>
        <small>MP4, MOV ou WEBM · 40 Mo maximum</small>
      </label>
      <label className="vision-consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>J’accepte le stockage privé de ma vidéo et l’analyse de trois images clés par le service IA. Je confirme avoir le droit de transmettre cette vidéo.</span>
      </label>
      <button className="btn" type="submit" disabled={busy || !consent}>{busy ? 'TRAITEMENT…' : 'ENVOYER ET ANALYSER'}</button>
      {busy && <p className="vision-progress" role="status">{stage}</p>}
      {error && <p className="coach-error" role="alert">{error}</p>}
      {message && <p className="vision-success" role="status">{message}</p>}
    </form>
    {feedback && <section className="vision-report" aria-live="polite">
      <div className="eyebrow">TON RAPPORT MODEL AI</div>
      <h3 className="serif">Retour de séance</h3>
      {feedback.summary && <p className="vision-summary">{feedback.summary}</p>}
      {feedback.visibleStrengths?.length ? <div><strong>Points positifs observables</strong><ul>{feedback.visibleStrengths.map((x,i)=><li key={i}>{x}</li>)}</ul></div> : null}
      {feedback.improvements?.length ? <div><strong>Pistes de progression</strong><ul>{feedback.improvements.map((x,i)=><li key={i}>{x}</li>)}</ul></div> : null}
      {feedback.exercises?.length ? <div><strong>Exercices recommandés</strong><ul>{feedback.exercises.map((x,i)=><li key={i}>{x}</li>)}</ul></div> : null}
      {feedback.confidenceNote && <p className="vision-privacy">{feedback.confidenceNote}</p>}
    </section>}
  </>;
}
