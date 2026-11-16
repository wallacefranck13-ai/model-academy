# MODEL ACADEMY — contrôle avant mise en production

## Infrastructure
- [ ] Créer une base PostgreSQL dédiée à MODEL ACADEMY (ne pas réutiliser un projet Supabase non confirmé).
- [ ] Activer Supabase Auth et configurer les URL de redirection de production.
- [ ] Créer les buckets Storage privés `model-training` et `model-portfolio`, puis appliquer les scripts RLS de `docs/`.
- [ ] Configurer `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.
- [ ] Configurer les clés IA côté serveur seulement.
- [ ] Créer un dépôt Git source et connecter ce dépôt au projet Vercel.
- [ ] Configurer Vercel avec le monorepo pnpm et le répertoire racine `apps/web`.

## Base de données
- [ ] Appliquer les migrations dans l'ordre documenté : casting, portfolio/training, v0.9, v1.0 messaging.
- [ ] Vérifier les contraintes et index Prisma sur une base de préproduction.
- [ ] Créer le premier compte ADMIN après inscription et vérifier les permissions.
- [ ] Charger les cours de démarrage et les plans tarifaires après validation de leur contenu.

## Sécurité et conformité
- [ ] Tester les parcours de connexion, réinitialisation du mot de passe et déconnexion.
- [ ] Vérifier les permissions pour chaque rôle et chaque action sensible.
- [ ] Tester les politiques RLS avec un utilisateur non propriétaire.
- [ ] Vérifier les consentements média, la suppression et les URLs signées.
- [ ] Prévoir les procédures de signalement, modération et suppression de compte.
- [ ] Valider les mentions légales, politique de confidentialité, conditions et règles de protection des mineurs avec un conseil local.

## Paiements et notifications externes
- [ ] Signer les contrats et obtenir les identifiants API officiels des prestataires Mobile Money.
- [ ] Implémenter les webhooks signés, l'idempotence, les rapprochements et les remboursements.
- [ ] Ne jamais activer un paiement réel avec un adaptateur de test ou des identifiants non vérifiés.
- [ ] Configurer les fournisseurs e-mail, SMS et push et tester les modèles de messages.

## Tests et mise en ligne
- [ ] Installer les dépendances avec pnpm et exécuter la génération Prisma.
- [ ] Exécuter le contrôle TypeScript, le build Next.js et les tests end-to-end.
- [ ] Tester la préproduction sur Android, iOS et navigateurs mobiles/desktop.
- [ ] Configurer le domaine, DNS, HTTPS, analytics respectueux de la vie privée et alertes.
- [ ] Vérifier `/api/health` après déploiement et effectuer un test fonctionnel complet.
- [ ] Sauvegarder la base et tester une restauration avant ouverture publique.

## État actuel
Le dépôt ZIP est un livrable de code, pas une application déjà hébergée. La compilation de production et le déploiement restent en attente de l'installation des dépendances, d'un dépôt Git connecté, d'une base dédiée et des secrets d'environnement.

### Facturation v1.2 — points bloquants avant activation
- [ ] Valider les tarifs, conditions, renouvellements, taxes et politique de remboursement.
- [ ] Obtenir les contrats marchands et identifiants officiels Mixx by Yas, TMoney et Flooz.
- [ ] Configurer un prestataire de paiement carte si nécessaire.
- [ ] Implémenter les callbacks/webhooks signés, vérification serveur, idempotence et rapprochement.
- [ ] Tester les paiements réels en environnement sandbox puis production.
- [ ] N’activer les abonnements qu’après confirmation serveur du paiement.
- [ ] Faire valider les modèles de contrats et le processus de signature.
