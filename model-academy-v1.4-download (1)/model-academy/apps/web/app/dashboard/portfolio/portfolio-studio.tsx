'use client';
import { FormEvent, useState } from 'react';

type Media = { id: string; caption: string | null; url: string; createdAt: string };

export default function PortfolioStudio({ initialMedia }: { initialMedia: Media[] }) {
  const [media, setMedia] = useState(initialMedia);
  const [caption, setCaption] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  async function addImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set('caption', caption);
    data.set('consent', String(consent));
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/portfolio/media', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Ajout impossible.');
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally { setBusy(false); }
  }

  async function removeImage(id: string) {
    if (!window.confirm('Supprimer définitivement cette image du portfolio ?')) return;
    setError(''); setNotice('');
    try {
      const response = await fetch('/api/portfolio/media', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId: id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Suppression impossible.');
      setMedia((items) => items.filter((item) => item.id !== id));
      setNotice(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    }
  }

  return <div className="portfolio-studio">
    <section className="card portfolio-add">
      <div className="eyebrow">AJOUTER À MON BOOK</div>
      <h2 className="serif">Sélectionne tes meilleures images.</h2>
      <form onSubmit={addImage}>
        <label className="portfolio-file"><input type="file" name="image" accept="image/jpeg,image/png,image/webp" required /><span>JPG · PNG · WEBP — 8 Mo maximum</span></label>
        <input className="portfolio-caption" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={180} placeholder="Légende (ex. : portrait studio, look éditorial…)" />
        <label className="vision-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span>Je confirme avoir les droits sur cette image et autorise son stockage dans mon portfolio privé. Elle ne sera pas publique.</span></label>
        <button className="btn" type="submit" disabled={busy || !consent}>{busy ? 'AJOUT EN COURS…' : 'AJOUTER L’IMAGE'}</button>
      </form>
      {error && <p className="coach-error" role="alert">{error}</p>}
      {notice && <p className="vision-success" role="status">{notice}</p>}
    </section>
    <section className="portfolio-gallery">
      <div className="eyebrow">MES VISUELS · {media.length}</div>
      {media.length === 0 ? <div className="card portfolio-empty"><span>✦</span><h3 className="serif">Ton book commence ici.</h3><p className="muted">Ajoute des portraits et des photos professionnelles. Tu gardes le contrôle de leur visibilité.</p></div> :
        <div className="portfolio-grid">{media.map((item) => <article className="portfolio-item" key={item.id}>
          <img src={item.url} alt={item.caption || 'Image du portfolio'} />
          <div><p>{item.caption || 'Sans légende'}</p><small>PRIVÉ · {new Date(item.createdAt).toLocaleDateString('fr-FR')}</small><button type="button" onClick={() => void removeImage(item.id)}>Supprimer</button></div>
        </article>)}</div>}
    </section>
  </div>;
}
