import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
type LessonSeed = [string, string, number];
const courses: Array<{ slug: string; title: string; category: string; level: string; description: string; lessons: LessonSeed[] }> = [
  { slug: 'fondamentaux-mannequinat', title: 'Les fondamentaux du mannequinat', category: 'ESSENTIELS', level: 'Débutant', description: 'Découvre les métiers, les codes professionnels, les exigences et les opportunités du mannequinat.', lessons: [
    ['Comprendre les métiers du mannequinat', 'Le mannequinat regroupe plusieurs spécialités : podium, éditorial, commercial, beauté, publicité et e-commerce. Identifie les univers qui correspondent à tes objectifs.', 12],
    ['Construire une attitude professionnelle', 'La ponctualité, la préparation, le respect des équipes et la communication sont essentiels. Un talent professionnel se distingue aussi par sa fiabilité.', 10],
    ['Connaître son profil et ses objectifs', 'Observe tes points forts, définis les domaines qui t’intéressent et fixe un objectif réaliste pour les trois prochains mois.', 12],
  ] },
  { slug: 'demarche-podium', title: 'La démarche podium', category: 'TECHNIQUE', level: 'Débutant', description: 'Travaille la posture, l’équilibre, la coordination et la présence sur un runway.', lessons: [
    ['Posture et alignement', 'Garde la tête alignée, les épaules détendues et le buste naturellement ouvert. Évite de crisper les bras ou de forcer le dos.', 12],
    ['Équilibre et rythme', 'Commence lentement sur une ligne droite. Pose un pied devant l’autre sans croiser exagérément et garde un rythme régulier.', 15],
    ['Entrée, pivot et sortie', 'Répète une entrée calme, un arrêt stable, un pivot maîtrisé puis une sortie assurée. Filme-toi pour observer ta régularité.', 15],
  ] },
  { slug: 'posing-photo', title: 'Posing photographique', category: 'IMAGE', level: 'Débutant', description: 'Apprends à varier les poses, les angles et les expressions pour raconter une histoire en image.', lessons: [
    ['Les lignes du corps', 'Crée des lignes simples avec les bras et les jambes. Déplace légèrement le poids du corps pour éviter une pose rigide.', 12],
    ['Expressions et regard', 'Entraîne plusieurs expressions devant un miroir. Garde une intention claire et adapte le regard à l’ambiance demandée.', 12],
    ['Créer une série cohérente', 'Prépare cinq poses complémentaires : portrait, trois-quarts, plein pied, mouvement et pose éditoriale.', 15],
  ] },
  { slug: 'reussir-casting', title: 'Réussir son casting', category: 'CARRIÈRE', level: 'Tous niveaux', description: 'Prépare ta présentation, tes photos, tes informations et ton comportement lors d’un casting.', lessons: [
    ['Lire un brief de casting', 'Vérifie le profil recherché, les dates, le lieu, les tenues, les usages des images et les conditions de rémunération.', 10],
    ['Préparer son book et sa présentation', 'Choisis des photos récentes et naturelles. Prépare une présentation courte, claire et honnête de ton expérience.', 12],
    ['Sécurité et professionnalisme', 'Vérifie l’identité de l’organisateur, demande les conditions écrites et informe une personne de confiance du lieu et de l’horaire.', 12],
  ] },
];
async function main() {
  for (const item of courses) {
    const { lessons, ...course } = item;
    await prisma.course.upsert({ where: { slug: course.slug }, update: { ...course, isPublished: true }, create: { ...course, isPublished: true, lessons: { create: lessons.map(([title, content, duration], i) => ({ title, content, duration: Number(duration), position: i + 1 })) } } });

  }
  const plans = [
    { code: 'STARTER', name: 'Starter', price: 0, interval: 'MONTH', features: ['Profil mannequin','Accès aux contenus gratuits','Candidatures aux castings publics'] },
    { code: 'MODEL_PLUS', name: 'Model Plus', price: 2000, interval: 'MONTH', features: ['Parcours de formation','Suivi de progression','Outils de préparation aux castings'] },
    { code: 'MODEL_PRO', name: 'Model Pro', price: 5000, interval: 'MONTH', features: ['Tout Model Plus','Coach IA avancé','Outils portfolio et carrière'] },
    { code: 'MODEL_PLUS_YEAR', name: 'Model Plus annuel', price: 20000, features: ['Parcours de formation','Suivi de progression','Outils de préparation aux castings'] , interval: 'YEAR' },
    { code: 'MODEL_PRO_YEAR', name: 'Model Pro annuel', price: 50000, features: ['Tout Model Plus','Coach IA avancé','Outils portfolio et carrière'], interval: 'YEAR' },
  ];
  for (const p of plans) await prisma.subscriptionPlan.upsert({ where: { code: p.code }, update: { name: p.name, price: p.price, features: p.features, interval: p.interval || 'MONTH' }, create: { ...p, currency: 'XOF', interval: p.interval || 'MONTH' } });
  const bootstrapAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (bootstrapAdminEmail) {
    const admin = await prisma.user.findUnique({ where: { email: bootstrapAdminEmail }, select: { id: true } });
    if (admin) await prisma.userRole.upsert({ where: { userId_role: { userId: admin.id, role: 'ADMIN' } }, update: {}, create: { userId: admin.id, role: 'ADMIN' } });
  }
}
main().finally(() => prisma.$disconnect());
