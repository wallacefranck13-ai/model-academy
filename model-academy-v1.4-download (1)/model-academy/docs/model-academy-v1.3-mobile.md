# Application mobile — configuration v1.3

L'application Expo utilise désormais le même projet Supabase Auth que le web, avec stockage sécurisé du jeton via `expo-secure-store`.

## Configuration
1. Copier `apps/mobile/.env.example` vers `apps/mobile/.env`.
2. Renseigner l'URL du projet Supabase et sa clé publique anon/publishable (jamais la clé `service_role`).
3. Dans Supabase Auth, autoriser les inscriptions email selon la politique de l'organisation.
4. Installer les dépendances du monorepo puis lancer `pnpm --filter @model-academy/mobile start`.

## Périmètre livré
- Connexion email/mot de passe.
- Création de compte email/mot de passe.
- Persistance de session dans le stockage sécurisé natif.
- Déconnexion et état de configuration explicite.

## Limites
- Le mobile authentifie via Supabase mais les écrans métier (école, coach, portfolio, castings, messagerie) ne sont pas encore reliés aux API web.
- Les liens de confirmation email et le deep linking de retour doivent être testés avec les URL finales du projet.
- Aucun secret Supabase ne doit être embarqué dans l'application. Seules l'URL et la clé publique sont attendues.
