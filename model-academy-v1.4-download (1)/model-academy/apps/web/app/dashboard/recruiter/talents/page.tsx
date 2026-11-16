import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { getCurrentUser } from '@/lib/current-user';

const recruiterRoles = new Set(['AGENCY', 'BRAND', 'PHOTOGRAPHER', 'ORGANIZER', 'ADMIN']);
const field: any = { padding: 11, border: '1px solid #ddd3c4', background: '#fffdf9', font: 'inherit', fontSize: 13, width: '100%' };

export default async function TalentDirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string; city?: string; stage?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  if (!user.roles.some((r) => recruiterRoles.has(r.role))) redirect('/dashboard/recruiter?error=role');
  const params = await searchParams;
  const q = String(params.q || '').trim().slice(0, 60);
  const city = String(params.city || '').trim().slice(0, 60);
  const stage = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PROFESSIONAL'].includes(String(params.stage)) ? String(params.stage) : undefined;
  const adultCutoff = new Date();
  adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
  const profiles = await prisma.modelProfile.findMany({
    where: {
      publicPortfolio: true,
      isAvailable: true,
      ...(stage ? { stage: stage as any } : {}),
      ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
      ...(q ? { OR: [
        { user: { fullName: { contains: q, mode: 'insensitive' as const } } },
        { biography: { contains: q, mode: 'insensitive' as const } },
        { specialties: { has: q } },
      ] } : {}),
      user: { status: 'ACTIVE', dateOfBirth: { lte: adultCutoff } },
    },
    include: { user: { select: { fullName: true, country: true } } },
    orderBy: [{ updatedAt: 'desc' }],
    take: 60,
  });
  return <>
    <div className="eyebrow">PROFESSIONAL PARTNERS · VERIFIED TALENT DISCOVERY</div>
    <h1 className="serif" style={{ fontSize: 42, fontWeight: 500 }}>Annuaire des talents.</h1>
    <p className="muted">Découvrez les mannequins adultes qui ont choisi de rendre leur profil visible aux recruteurs. Les portfolios et médias privés ne sont jamais exposés dans cet annuaire.</p>
    <form method="get" className="card" style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, margin: '22px 0' }}>
      <label style={{ fontSize: 11 }}>Nom, spécialité ou mot-clé<input name="q" defaultValue={q} placeholder="Ex. runway, commercial…" style={{ ...field, display: 'block', marginTop: 6 }} /></label>
      <label style={{ fontSize: 11 }}>Ville<input name="city" defaultValue={city} placeholder="Lomé" style={{ ...field, display: 'block', marginTop: 6 }} /></label>
      <label style={{ fontSize: 11 }}>Niveau<select name="stage" defaultValue={stage || ''} style={{ ...field, display: 'block', marginTop: 6 }}><option value="">Tous les niveaux</option><option value="BEGINNER">Débutant</option><option value="INTERMEDIATE">Intermédiaire</option><option value="ADVANCED">Avancé</option><option value="PROFESSIONAL">Professionnel</option></select></label>
      <div style={{ display: 'flex', alignItems: 'end', gap: 8 }}><button className="btn" type="submit">Rechercher</button><Link className="btn" href="/dashboard/recruiter/talents" style={{ background: 'transparent', color: '#24211d', border: '1px solid #d8cebf' }}>Effacer</Link></div>
    </form>
    <div className="eyebrow" style={{ marginBottom: 14 }}>{profiles.length} PROFIL(S) OPT-IN · ADULTES UNIQUEMENT</div>
    {profiles.length === 0 ? <section className="card" style={{ padding: 26 }}><h2 className="serif" style={{ fontSize: 25, fontWeight: 500 }}>Aucun profil correspondant.</h2><p className="muted">Élargissez votre recherche ou consultez les castings publiés. Les mannequins contrôlent eux-mêmes leur visibilité.</p><Link className="btn" href="/dashboard/castings">Voir les castings</Link></section> :
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 14 }}>
        {profiles.map((p) => <article className="card" key={p.id} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div className="eyebrow">{p.city || 'Ville non précisée'} · {p.country}</div>
          <h2 className="serif" style={{ fontSize: 25, fontWeight: 500, margin: 0 }}>{p.user.fullName}</h2>
          <div className="muted" style={{ fontSize: 11 }}>{({ BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire', ADVANCED: 'Avancé', PROFESSIONAL: 'Professionnel' } as Record<string, string>)[p.stage]}</div>
          {p.biography && <p className="muted" style={{ fontSize: 13, margin: 0 }}>{p.biography.slice(0, 220)}{p.biography.length > 220 ? '…' : ''}</p>}
          {p.specialties.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{p.specialties.slice(0, 5).map((tag) => <span key={tag} className="eyebrow" style={{ background: '#f0e9dd', padding: '5px 7px' }}>{tag}</span>)}</div>}
          {p.languages.length > 0 && <div className="muted" style={{ fontSize: 11 }}>Langues : {p.languages.join(', ')}</div>}
          <div className="muted" style={{ fontSize: 10, marginTop: 'auto', borderTop: '1px solid #e8e0d5', paddingTop: 10 }}>Profil visible avec le consentement du mannequin. Aucun média privé n’est partagé.</div>
        </article>)}
      </div>}
    <p className="muted" style={{ fontSize: 11, marginTop: 22 }}>Les critères de recherche servent uniquement à trouver des profils ayant activé leur visibilité. Ils ne constituent pas une évaluation de la valeur ou du potentiel d’une personne.</p>
  </>;
}
