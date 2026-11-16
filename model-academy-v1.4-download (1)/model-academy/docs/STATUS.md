# MODEL ACADEMY — état du projet

## Version 0.3 — couche données et école interactive
- Synchronisation de l'identité Supabase vers `User`, création du profil mannequin et du rôle `MODEL` à la première session authentifiée.
- Client Prisma partagé dans le workspace.
- Catalogue de cours publié depuis PostgreSQL.
- Inscription idempotente à un cours et suivi de progression par leçon.
- Validation de fin de parcours lorsque toutes les leçons sont terminées.
- Données de démonstration : quatre parcours pédagogiques et trois plans tarifaires.

## Mise en route locale
1. Copier `.env.example` à la racine pour Prisma/PostgreSQL et `apps/web/.env.example` vers `apps/web/.env.local` pour les clés Supabase et l’URL publique.
2. Depuis la racine : `pnpm install`.
3. Générer le client : `pnpm --filter @model-academy/database db:generate`.
4. Appliquer le schéma au PostgreSQL de développement : `pnpm --filter @model-academy/database exec prisma db push`.
5. Charger le catalogue : `pnpm --filter @model-academy/database db:seed`.
6. Lancer le web : `pnpm --filter @model-academy/web dev`.

Pour la production, créer et versionner une migration Prisma (`prisma migrate dev --name core`) avant d'utiliser `prisma migrate deploy`. Ne pas utiliser `db push` en production.

## Limites connues
- Aucune clé Supabase/PostgreSQL n'est fournie dans le dépôt : la synchronisation ne fonctionne qu'après configuration.
- Les cours sont un premier contenu pédagogique écrit ; vidéos, examens, certificats PDF et interface formateur restent à développer.
- Coach IA, analyse vidéo, paiement Mobile Money, notifications, modération des castings et déploiement public restent à connecter.
- Aucun déploiement ni test de build n'est revendiqué dans cette version.


## Version 0.4 — MODEL AI conversationnel
- Interface de chat responsive intégrée au tableau de bord.
- Route serveur authentifiée, clé fournisseur conservée côté serveur.
- Historique des conversations et messages persisté dans PostgreSQL via Prisma.
- Instructions pédagogiques en français, garde-fous contre les conseils corporels dangereux et les jugements discriminatoires.
- Suggestions de sujets : démarche, casting, posing, portfolio.
- Configuration requise : `OPENAI_API_KEY` et `OPENAI_MODEL` dans l'environnement serveur.
- À faire avant production : générer/appliquer la migration Prisma, installer les dépendances, tester avec un compte de démonstration, configurer les limites et la supervision des coûts.
- L'analyse vidéo et l'upload sécurisé ne sont pas inclus dans cette version.


## Version 0.5 — MODEL AI Vision, collecte vidéo privée
- Formulaire d’envoi MP4/MOV/WEBM avec limite serveur de 40 Mo.
- Consentement explicite requis avant l’envoi.
- Stockage Supabase privé, chemins isolés par identifiant Supabase.
- Enregistrement des séances dans `AITrainingSession` et affichage des 5 derniers envois.
- Script SQL de création du bucket privé et politiques RLS dans `docs/model-training-storage.sql`.
- Limite fonctionnelle importante : cette version collecte et conserve les vidéos ; elle ne calcule pas encore de score ni de diagnostic visuel. Le moteur d’analyse vidéo doit être sélectionné, connecté et validé avant de promettre des retours automatiques.
- Configuration : exécuter le SQL Supabase, appliquer la migration Prisma, tester upload/lecture/suppression et fixer une politique de conservation.


## Version 0.6 — Rapport visuel à partir d’images clés
- Extraction locale dans le navigateur de trois images JPEG depuis la vidéo choisie (20 %, 50 %, 80 % de sa durée).
- Envoi des images au serveur après dépôt sécurisé de la vidéo.
- Route authentifiée vérifiant que la séance appartient au compte courant.
- Appel au modèle vision OpenAI configurable via `OPENAI_VISION_MODEL`.
- Rapport JSON : résumé, points positifs visibles, pistes de progression, exercices et note sur les limites.
- Le rapport est sauvegardé dans `AITrainingSession.feedback`; statut `ANALYZED_KEY_FRAMES`.
- Limite : trois images fixes ne permettent pas de mesurer la démarche, la vitesse, les angles articulaires ou la fluidité du mouvement. Ne pas présenter ce rapport comme une analyse biomécanique.
- Préproduction : définir les consentements et durées de conservation, vérifier politique de données du fournisseur IA, générer/appliquer migration Prisma, tester sur divers mobiles et formats, contrôler coûts et taille des requêtes.

## Version 0.7 — MODEL PORTFOLIO privé
- Édition du titre et de la présentation du book.
- Ajout d’images JPG/PNG/WEBP avec consentement explicite et limite de 8 Mo.
- Bucket Supabase privé `model-portfolio`, règles RLS par dossier utilisateur et URL signées temporaires pour affichage.
- Suppression d’une image avec vérification de propriété côté serveur et suppression du fichier associé.
- Métadonnées et consentement enregistrés dans `Portfolio`, `PortfolioMedia` et `MediaConsent`.
- Toutes les images sont privées par défaut. Aucun lien public ni partage externe n'est activé dans cette version.
- Configuration : exécuter `docs/model-portfolio-storage.sql`, migrer Prisma, vérifier les permissions Storage et tester ajout/affichage/suppression.

## Version 0.8 — MODEL CASTING et espace recruteur
- Catalogue des castings publiés, avec filtre de sécurité serveur : statut `PUBLISHED`, indicateur `isVerified` et date limite valide.
- Fiche détaillée : brief, exigences, rémunération, échéance et droits d’utilisation de l’image.
- Candidature mannequin idempotente (une candidature par casting et profil), message facultatif et retrait contrôlé.
- Espace recruteur réservé aux rôles `AGENCY`, `BRAND`, `PHOTOGRAPHER` et `ORGANIZER` attribués par l’administration ; les utilisateurs standards ne peuvent pas s’auto-attribuer ces rôles.
- Dépôt d’annonce en `PENDING_REVIEW`, jamais publiée directement ; contrôle du titre, du brief, du budget, de la devise, du pays et de l’échéance.
- Tableau des annonces déposées et compte des candidatures.
- Schéma Casting enrichi : exigences, type de rémunération, droits d’image, indicateur `isVerified` et index de recherche.
- Protection anti-fraude affichée : pas de frais de candidature, transparence sur la rémunération et les droits d’image.
- Configuration requise : régénérer Prisma et appliquer une migration de schéma avant utilisation. Le flux de modération admin et la gestion détaillée des candidatures côté recruteur restent à construire ; aucune annonce fictive n’est créée.
- Cette archive est un livrable de code, pas un déploiement. L’installation, la compilation et les tests d’intégration doivent être effectués avec les variables et services du projet.
- SQL d’évolution disponible dans `docs/model-casting-migration.sql` ; la validation d’une annonce doit être réalisée uniquement par un administrateur après contrôle hors interface publique.
- L’espace recruteur affiche également les candidatures reçues avec le nom de profil et le statut. Les actions de changement de statut des candidatures et le contact sécurisé recruteur/mannequin sont prévus pour une prochaine version.

## Version 0.9 — Agency, Brand, Sponsor et Admin Studios
- Navigation du tableau de bord adaptée aux rôles réels attribués au compte.
- Agency Studio : annuaire limité aux profils mannequins disponibles et explicitement publics ; indicateurs des castings et candidatures de l'agence.
- Brand Studio : suivi des campagnes/castings, nombre de candidatures et accès au dépôt d'une nouvelle campagne.
- Sponsor Studio : création de programmes de soutien, montant indicatif, type de soutien, échéance et envoi à la modération.
- Espace mannequin : consultation et candidature aux programmes de soutien publiés et vérifiés.
- Admin Studio : modération des castings et programmes sponsors, attribution des rôles professionnels sur la base de l'e-mail d'un compte existant, consultation des comptes récents.
- Espace recruteur : changement du statut de candidature par le propriétaire de l'annonce ; contrôle d'appartenance et validation côté serveur.
- Nouveaux modèles PostgreSQL : `SponsorOpportunity`, `SponsorApplication`; rôle `SPONSOR` et enums de statut associés.
- Migration SQL fournie : `docs/model-academy-v0.9-migration.sql`.
- Sécurité : seules les annonces approuvées par un ADMIN deviennent `PUBLISHED` et `isVerified=true`; les profils affichés dans l'annuaire sont limités à `publicPortfolio=true` et `isAvailable=true`.
- À faire avant production : exécuter la migration sur une base de test, vérifier la migration Prisma, installer et compiler, tester les rôles/candidatures/modération et ajouter les politiques de confidentialité/conditions contractuelles.
- Aucun paiement sponsor ni transaction financière n'est déclenché par cette version ; les montants sont informatifs et les échanges contractuels doivent être vérifiés avant toute mise en œuvre.


## Version 0.10 — Messagerie professionnelle
- Ajout d'une messagerie privée entre deux membres, rattachable à une candidature de casting.
- Ouverture d'une conversation autorisée uniquement au mannequin concerné, au recruteur propriétaire de l'annonce ou à l'administration.
- Envoi limité à 2 000 caractères, vérification de l'appartenance à la conversation, mise à jour de l'activité et notification du destinataire.
- Liste des conversations et fil de discussion avec marquage des messages reçus comme lus.
- Limitation applicative : 30 messages par heure et par expéditeur ; les 150 derniers messages sont chargés dans le fil.
- Migration SQL : `docs/model-academy-v1.0-messaging.sql`.
- Limites : pas encore de pièces jointes, appels, chiffrement de bout en bout ni anti-spam distribué. Les messages sont des données privées applicatives, pas une messagerie chiffrée E2E.


## Version 1.1 — Centre de notifications
- Centre de notifications personnel avec liste chronologique, compteur de non-lues et actions de lecture individuelle ou globale.
- Notifications déclenchées à la réception d'une nouvelle candidature casting et lors de la mise à jour du statut d'une candidature casting ou d'une demande de soutien.
- Contrôle systématique du propriétaire lors du marquage comme lu.
- Aucun service de notification externe n'est encore connecté : les notifications sont internes à l'application.

## v1.2 — abonnements, contrats et réservations

- Page `dashboard/billing` : formule active, catalogue tarifaire, historique des paiements.
- Catalogue initial : Starter gratuit, Model Plus (2 000 FCFA/mois ou 20 000 FCFA/an), Model Pro (5 000 FCFA/mois ou 50 000 FCFA/an).
- Moyens de paiement Mixx by Yas, TMoney, Flooz et carte affichés comme « en configuration » : aucune transaction fictive ni activation automatique.
- Pages `dashboard/contracts` et `dashboard/bookings` pour consulter les contrats et réservations rattachés au profil.
- Navigation du tableau de bord enrichie.
- Le catalogue des abonnements est initialisé par `pnpm --filter @model-academy/database db:seed`.

## v1.3 — workflows carrière
- Réponse mannequin aux propositions de contrat : accepter (statut `ACCEPTED_PENDING_SIGNATURE`) ou refuser.
- Réponse aux propositions de réservation : confirmer ou décliner.
- Contrôle serveur de propriété du contrat/de la réservation avant toute transition.
- Notifications in-app et revalidation des espaces après réponse.
- Migration SQL dédiée : `model-academy-v1.3-career-workflows.sql`.
- L'acceptation d'une proposition ne constitue pas une signature électronique ni une validation juridique du contrat.
- Application Expo : connexion/inscription email via Supabase Auth, session persistée avec `expo-secure-store`, déconnexion et documentation de configuration.
- Limite mobile : authentification intégrée, mais les modules métier mobiles restent à connecter aux API.


## v1.4 — annuaire professionnel des talents
- Nouvel espace `/dashboard/recruiter/talents`, réservé aux rôles professionnels autorisés et à l'administration.
- Recherche de profils par nom, biographie, spécialité, ville et niveau.
- L'annuaire ne retourne que les profils disponibles ayant explicitement activé `publicPortfolio`, avec un compte actif et une date de naissance renseignée correspondant à un adulte.
- Aucun média, adresse e-mail, téléphone ou identifiant privé n'est exposé dans les cartes de l'annuaire.
- La visibilité de l'annuaire est distincte de la visibilité des médias : les portfolios et médias privés ne sont pas rendus accessibles par cette page.
- Navigation recruteur enrichie avec un accès direct à l'annuaire.
- L'annuaire est une fonction de découverte, pas un classement ni une recommandation automatisée des personnes.
