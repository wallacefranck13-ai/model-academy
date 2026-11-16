import { redirect } from 'next/navigation';
import { prisma } from '@model-academy/database';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/current-user';
import { updatePortfolio } from '@/app/actions/portfolio';
import PortfolioStudio from './portfolio-studio';

export default async function Page() {
  const user = await getCurrentUser();
  if (!user?.modelProfile) redirect('/sign-in');
  const portfolio = await prisma.portfolio.findUnique({
    where: { modelId: user.modelProfile.id },
    include: { media: { orderBy: { createdAt: 'desc' }, take: 30 } },
  });
  const supabase = await createClient();
  const media = await Promise.all((portfolio?.media || []).map(async (item) => {
    const { data } = await supabase.storage.from('model-portfolio').createSignedUrl(item.storageKey, 600);
    return { id: item.id, caption: item.caption, createdAt: item.createdAt.toISOString(), url: data?.signedUrl || '' };
  }));

  return <>
    <div className="eyebrow">YOUR PROFESSIONAL BOOK</div>
    <h1 className="serif" style={{fontSize:44,fontWeight:500}}>Ton portfolio.</h1>
    <p className="muted">Construis une vitrine professionnelle. Tes images restent privées tant que tu ne décides pas de les partager.</p>
    <form action={updatePortfolio} className="card portfolio-profile">
      <div className="eyebrow">PRÉSENTATION DU MANNEQUIN</div>
      <label>Nom du portfolio<input name="title" maxLength={80} defaultValue={portfolio?.title || `Portfolio de ${user.fullName}`} required /></label>
      <label>Présentation<textarea name="description" maxLength={1200} rows={3} defaultValue={portfolio?.description || ''} placeholder="Présente ton univers, tes spécialités et tes expériences…" /></label>
      <label style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:11,lineHeight:1.6}}><input type="checkbox" name="publicPortfolio" defaultChecked={user.modelProfile.publicPortfolio} style={{marginTop:2}}/> Je souhaite rendre mon profil (nom, ville, spécialités et présentation) visible aux agences vérifiées. Mes photos restent privées.</label>
      <button className="btn" type="submit">ENREGISTRER MA PRÉSENTATION</button>
    </form>
    <PortfolioStudio initialMedia={media.filter((item) => item.url)} />
  </>;
}
