# MODEL ACADEMY

Plateforme web et mobile de formation et de développement de carrière pour mannequins. Direction artistique Luxury Editorial : noir profond, ivoire et or champagne. Lancement prévu à Lomé (Togo), puis extension régionale.

## Architecture
- `apps/web` : application Next.js 15 / React 19
- `apps/mobile` : socle Expo Android/iOS
- `packages/database` : schéma PostgreSQL / Prisma et client partagé
- Authentification : Supabase Auth
- Hébergement cible : Vercel

## Modules présents dans le code
- Authentification et profil mannequin
- École, cours et suivi de progression
- MODEL AI conversationnel et rapport visuel sur images-clés vidéo
- Portfolio privé avec consentement et URLs signées temporaires
- Castings, candidatures et espace recruteur avec modération
- Agency Studio, Brand Studio, Sponsor Studio et Admin Studio\n- Annuaire professionnel des mannequins adultes ayant activé leur visibilité, avec filtres par ville, niveau et spécialité
- Programmes de soutien et candidatures aux sponsors
- Messagerie privée entre mannequin et recruteur, rattachée à une candidature
- Centre de notifications internes avec suivi des messages et candidatures

## Installation locale
1. Installer Node.js 20+ et pnpm 10.
2. Copier `.env.example` à la racine et `apps/web/.env.example` vers `apps/web/.env.local`.
3. Renseigner les variables Supabase, PostgreSQL et IA selon les modules utilisés.
4. Depuis la racine : `pnpm install`.
5. Générer Prisma : `pnpm db:generate`.
6. En développement seulement, synchroniser le schéma : `pnpm db:push`.
7. Charger les cours de démonstration : `pnpm db:seed`.
8. Lancer : `pnpm dev:web`.

Pour la production, créer une migration Prisma versionnée et utiliser `prisma migrate deploy`. Ne jamais exécuter `db push` en production.

## Rôles professionnels
Les rôles `AGENCY`, `BRAND`, `SPONSOR`, `PHOTOGRAPHER`, `ORGANIZER`, `TRAINER` et `ADMIN` ne doivent jamais être attribués à l'inscription publique. Un administrateur attribue les rôles après contrôle. Le premier compte ADMIN doit être créé après inscription : définir `BOOTSTRAP_ADMIN_EMAIL` dans l’environnement serveur puis relancer le seed. Le seed n’attribue ce rôle qu’à un compte existant correspondant exactement à cet e-mail.

## Déploiement
Le projet est préparé pour un monorepo pnpm sur Vercel. Configurer les variables d'environnement avant le déploiement : `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_VISION_MODEL`, `NEXT_PUBLIC_APP_URL`. Les migrations SQL et scripts Storage se trouvent dans `docs/`.

## Sécurité et limites
- Les portfolios sont privés par défaut. La visibilité d'un profil dans l'annuaire agence nécessite un opt-in ; les médias restent privés.
- Les castings et programmes sponsors sont invisibles jusqu'à modération.
- Les montants de sponsoring sont informatifs : aucun transfert d'argent n'est implémenté dans ce module.
- La messagerie est privée au niveau applicatif mais ne propose pas encore de chiffrement de bout en bout ni de pièces jointes.
- Les notifications sont internes à l'application ; aucun fournisseur SMS, e-mail ou push n'est connecté.
- L'analyse visuelle porte sur des images-clés et ne constitue pas une analyse biomécanique.
- Les fonctionnalités concernant les mineurs exigent des règles de consentement et un contrôle du parent/tuteur avant ouverture publique.

Consulter `docs/STATUS.md` pour l'historique et les points de validation avant production.

### Workflows carrière v1.3
Les mannequins peuvent répondre aux propositions de contrat et de réservation depuis leur tableau de bord. Une acceptation de contrat est enregistrée comme `ACCEPTED_PENDING_SIGNATURE` : elle ne constitue pas une signature électronique.

### Application mobile v1.3
L'application Expo dispose d'un écran de connexion/inscription Supabase Auth et d'une persistance sécurisée de session. Configurer `apps/mobile/.env` à partir de `apps/mobile/.env.example` avant lancement. Les écrans métier mobiles restent à connecter.
