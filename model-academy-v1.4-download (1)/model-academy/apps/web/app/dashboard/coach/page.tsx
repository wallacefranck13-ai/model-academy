import CoachChat from './coach-chat';
import VisionUpload from './vision-upload';
import { getCurrentUser } from '@/lib/current-user';
import { prisma } from '@model-academy/database';

const focusNames: Record<string, string> = {
  WALK: 'Démarche et coordination', POSTURE: 'Posture et équilibre',
  POSING: 'Posing et transitions', EXPRESSION: 'Expression caméra',
  CASTING: 'Présentation casting', GENERAL: 'Entraînement général',
};

export default async function Page() {
  const user = await getCurrentUser();
  const sessions = user ? await prisma.aITrainingSession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, sessionType: true, status: true, createdAt: true },
  }) : [];

  return <>
    <div className="eyebrow">MODEL AI · STUDIO</div>
    <h1 className="serif" style={{fontSize:44,fontWeight:500,marginBottom:8}}>Ton coach personnel.</h1>
    <p className="muted">Un accompagnement pour développer tes compétences et préparer ta carrière, étape par étape.</p>
    <CoachChat />
    <section className="vision-section">
      <div className="eyebrow">MODEL AI VISION · ÉTAPE 1</div>
      <h2 className="serif" style={{fontSize:32,fontWeight:500,margin:'8px 0'}}>Ton entraînement en vidéo.</h2>
      <p className="muted">Envoie une courte vidéo pour constituer ton dossier d’entraînement privé. Le moteur d’analyse automatique sera raccordé dans une prochaine version.</p>
      <div className="vision-grid">
        <div className="card vision-card">
          <VisionUpload />
        </div>
        <div className="card vision-card">
          <div className="eyebrow">MES ENVOIS RÉCENTS</div>
          {sessions.length === 0 ? <p className="muted" style={{fontSize:12,lineHeight:1.7}}>Tes séances vidéo apparaîtront ici après ton premier envoi.</p> : sessions.map((s) => (
            <div className="vision-session" key={s.id}>
              <span className="vision-session-mark">▶</span>
              <div><strong>{focusNames[s.sessionType] || s.sessionType}</strong><small>{s.createdAt.toLocaleDateString('fr-FR')} · {s.status === 'UPLOADED_PENDING_ANALYSIS' ? 'En attente d’analyse' : s.status}</small></div>
            </div>
          ))}
          <p className="vision-privacy">Tes vidéos ne sont pas publiques. Ne filme pas d’autres personnes sans leur accord. Pour les mineurs, un parent ou tuteur doit participer à la démarche.</p>
        </div>
      </div>
    </section>
  </>;
}
