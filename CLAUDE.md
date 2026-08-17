# Sfera'Solys — CLAUDE.md

Site de rencontre premium français. Orientation : sécurité, authenticité, expérience masculine. **Cible : hommes 28 ans et plus.**

Sfera'Solys est le **pendant masculin de SferaLuna** (Solys = solaire / Luna = lunaire). C'est un **fork séparé** : repo indépendant, base MongoDB distincte, **même moteur technique**, identité visuelle propre. Garder la structure de fichiers alignée sur SferaLuna pour faciliter les cherry-picks de correctifs entre les deux projets.

> ⚠️ Ce projet vient d'être forké depuis SferaLuna. Tant que le rebranding (section dédiée en bas) n'est pas terminé, du code, des libellés et des configs référencent encore « SferaLuna » / « Luna » / la base `sferaluna`. Ne jamais réutiliser les secrets de SferaLuna : toutes les clés (MongoDB, Stripe, Pusher, Cloudinary, Resend, Google, Apple) doivent être régénérées pour Sfera'Solys.

⸻

## Stack technique

* Framework : Next.js 15 (App Router) / React 18 / TypeScript
* Styles : Tailwind CSS 3, Framer Motion, Lucide React
* Auth : NextAuth v4 — Google OAuth + Apple Sign In (HTTPS) + credentials (bcrypt) + vérification email (Resend)
* BDD : MongoDB Atlas + Mongoose (base **`sferasolys`** — voir rebranding, l'ancienne était `sferaluna`)
* Paiement : Stripe (abonnements mensuels) + Stripe Identity (vérification d'identité)
* Validation : Zod + React Hook Form
* SEO : Metadata Next.js, OpenGraph, Twitter Cards, sitemap, robots.txt, JSON-LD
* Temps réel : Pusher (messagerie + notifications)
* Upload media : Cloudinary (photos de profil)
* Emails transactionnels : Resend (src/lib/resend.ts + src/lib/emails.ts)
* Rate limiting : src/lib/rate-limiter.ts — Upstash Redis (REST) distribué avec fallback mémoire, fail-open

⸻

## Direction artistique — « éclipse solaire »

C'est le seul volet entièrement nouveau par rapport à SferaLuna. Là où SferaLuna joue le lunaire (violets, nocturne), Sfera'Solys joue le solaire : eau profonde + soleil incandescent.

Palette (tokens Tailwind) :

| Token    | Hex       | Usage                              |
|----------|-----------|------------------------------------|
| `abyss`  | `#001724` | fond principal                     |
| `teal`   | `#15676D` | surfaces, cartes                   |
| `cream`  | `#FFEBD1` | texte sur fond sombre              |
| `orange` | `#FF7A00` | accent solaire, CTA, liens         |
| `rust`   | `#79280E` | accent profond, hover, états       |

Typographie :

* Display : **Archivo** (largeur expanded ~125), en bas-de-casse
* Accent  : **Fraunces** italique (touches éditoriales / chaleur)
* Corps   : **Instrument Sans** (400 / 500 / 600)

Signature de marque :

* Soleil en **éclipse** — un disque teal qui mord un disque orange (répond visuellement à la lune de SferaLuna)
* L'apostrophe de « Sfera'Solys » rendue comme un **point solaire orange**

Règles d'usage couleur :

* L'orange est un accent : CTA, liens, gros éléments, icônes. **Jamais** de petit texte orange sur teal (contraste insuffisant).
* Texte courant sur fond sombre = `cream`. Texte secondaire = cream désaturé/opacité.
* `rust` pour les hovers du primaire et les états chauds (erreurs douces, badges).

⸻

## Structure du projet

> Identique à SferaLuna (même moteur). Référence complète ci-dessous — inchangée par le fork sauf mentions de rebranding.

```
src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   ├── stats/route.ts                ← statistiques dashboard admin
│   │   │   ├── users/route.ts                ← gestion utilisateurs admin
│   │   │   ├── reports/route.ts + [id]/      ← gestion signalements
│   │   │   └── testimonials/route.ts + [id]/ ← approuver/rejeter témoignages
│   │   ├── circle/route.ts                   ← GET 6 profils curatés semaine
│   │   ├── community/route.ts + [id]/        ← posts communauté, like/comment
│   │   ├── events/route.ts + [id]/           ← events + toggle inscription
│   │   ├── likes/route.ts                    ← POST like / DELETE unlike
│   │   ├── matches/route.ts                  ← GET liste matches
│   │   ├── messages/[matchId]/route.ts       ← GET/POST messages d'un match
│   │   ├── notifications/route.ts            ← GET / POST mark as read
│   │   ├── profiles/route.ts + [id]/         ← découverte + profil public
│   │   ├── pusher/auth/route.ts              ← Auth canaux privés Pusher
│   │   ├── upload/avatar/route.ts            ← POST upload photo → Cloudinary
│   │   ├── identity-verification/route.ts    ← POST session Stripe Identity
│   │   ├── reports/route.ts                  ← POST signalement (hors admin)
│   │   ├── stats/route.ts                    ← GET statistiques publiques
│   │   ├── auth/register|verify-email|reset-password/route.ts
│   │   ├── subscription/check|status/route.ts
│   │   ├── vibementor/route.ts + [id]/       ← Q&A communauté
│   │   ├── vibeplanner/route.ts              ← plans rendez-vous
│   │   ├── vibesphere/route.ts + [id]/       ← feed social
│   │   ├── journal/route.ts + [id]/          ← journal émotionnel
│   │   ├── visitors/route.ts                 ← visites profil
│   │   ├── newsletter/route.ts               ← abonnement newsletter
│   │   ├── testimonials/route.ts             ← témoignages (public + auth)
│   │   ├── stripe/
│   │   │   ├── create-checkout-session/route.ts
│   │   │   ├── webhook/route.ts              ← checkout + subscription + invoice
│   │   │   ├── sync|cancel|pause|reactivate/route.ts
│   │   └── users/profile|update-profile|visibility/route.ts
│   ├── admin/page.tsx                        ← Dashboard admin
│   ├── auth/page.tsx + reset-password/       ← Login/Register NextAuth
│   ├── circle/page.tsx                       ← Circle of Six ✅
│   ├── communaute/page.tsx                   ← Forum communauté ✅
│   ├── contact/page.tsx
│   ├── evenements/page.tsx                   ← Événements ✅
│   ├── explorer/page.tsx                     ← Découverte + like/pass + match ✅
│   ├── inscription/page.tsx                  ← Onboarding multi-étapes
│   ├── matches/page.tsx                      ← Liste des matches ✅
│   ├── messages/[matchId]/page.tsx           ← Chat privé ✅
│   ├── mode-fantome/page.tsx                 ← Mode invisible premium ✅
│   ├── mon-compte/page.tsx                   ← Dashboard compte
│   ├── paiement/page.tsx                     ← Choix offre Stripe
│   ├── profil/[id]/page.tsx                  ← Profil public ✅
│   ├── vibementor|vibeplanner|vibesphere/page.tsx ✅
│   ├── vibesphere/journal/page.tsx           ← Journal émotionnel ✅
│   ├── sitemap.ts / robots.ts               ← SEO
│   ├── layout.tsx / layout-meta.ts          ← RootLayout + helper buildMeta
│   ├── accessibilite|confidentialite|conditions|cookies/
│   └── [marketing] commencer, equipe, faq, fonctionnalites, guide, histoire, tarifs, valeurs
├── components/  Header.tsx, Footer.tsx, JsonLd.tsx, ReportModal.tsx, UsageLimits.tsx
├── hooks/       usePremium.ts, useSubscription.ts
├── lib/         db.ts, stripe.ts, premium.ts, auth.ts, cloudinary.ts, pusher(.client).ts,
│                resend.ts, emails.ts, rate-limiter.ts, audit.ts, utils.ts, text-moderation.ts,
│                guards/premium-guard.ts, subscription/{config,service,subscription-check}.ts
├── models/      User, Subscription, AuditLog, Boost, Like, Match, Message, ProfileVisit,
│                VibePost, VibePlan, LunaEvent(→ renommer), CommunityPost, MentorPost,
│                NewsletterSubscriber, Testimonial, Report, JournalEntry
└── middleware/  check-limits.ts (SubscriptionChecker + requireSubscription)
```

### Modèle User.ts — types de référence (ne pas changer les valeurs)

```ts
type UserPlan = "free" | "essential-monthly" | "premium-monthly" | "elite-monthly";
type SubscriptionStatus = "inactive" | "active" | "trialing" | "past_due" | "canceled";
type ProfileVisibility = "public" | "matches" | "premium" | "invisible";
```

`isPremium` est auto-calculé en pre-save Mongoose (`active || trialing → true`). Ne jamais le setter manuellement hors webhook Stripe ou logique premium contrôlée.

⸻

## Plans tarifaires Stripe

| ID plan             | Nom       | Prix        |
|---------------------|-----------|-------------|
| `free`              | Gratuit   | 0 €         |
| `essential-monthly` | Essentiel | 9,99 €/mois |
| `premium-monthly`   | Premium   | 19,99 €/mois|
| `elite-monthly`     | Elite     | 34,99 €/mois|

Les Price IDs Stripe sont dans `.env.local` (`STRIPE_PRICE_ESSENTIAL_MONTHLY`, `_PREMIUM_MONTHLY`, `_ELITE_MONTHLY`). **À régénérer** : créer de nouveaux produits/prix Stripe pour Sfera'Solys, ne pas réutiliser ceux de SferaLuna.

⸻

## Variables d'environnement requises (.env.local)

> Toutes à **régénérer** pour Sfera'Solys. Ne jamais committer ce fichier.

```
MONGODB_URI=mongodb+srv://...          # nouveau cluster, base sferasolys
GOOGLE_CLIENT_ID=... / GOOGLE_CLIENT_SECRET=...   # nouveau projet Google Cloud
NEXTAUTH_URL=http://localhost:3000     # prod : domaine canonique Sfera'Solys
NEXTAUTH_SECRET=...
STRIPE_SECRET_KEY=... / STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_ESSENTIAL_MONTHLY=... / _PREMIUM_MONTHLY=... / _ELITE_MONTHLY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLOUDINARY_CLOUD_NAME=... / CLOUDINARY_API_KEY=... / CLOUDINARY_API_SECRET=...
PUSHER_APP_ID=... / PUSHER_KEY=... / PUSHER_SECRET=... / PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=... / NEXT_PUBLIC_PUSHER_CLUSTER=eu
RESEND_API_KEY=... / RESEND_FROM_EMAIL=...
UPSTASH_REDIS_REST_URL=... / UPSTASH_REDIS_REST_TOKEN=...   # optionnel, fallback mémoire
```

⸻

## Flux utilisateur complet

```
/auth → /inscription (5 étapes) → POST /api/users/update-profile (hasCompletedProfile=true)
  → /paiement → POST /api/stripe/create-checkout-session → Stripe Checkout
    → POST /api/stripe/webhook (checkout.session.completed) → isPremium=true → /mon-compte?payment=success

Découverte & match : /explorer → GET /api/profiles → POST /api/likes { targetUserId }
  → si match mutuel → Match → modal → /messages/[matchId] ; POST /api/visitors (auto)

Messagerie : /messages/[matchId] → GET/POST /api/messages/[matchId]
  → Pusher canal private-match-{matchId} (temps réel)

Notifications : GET /api/notifications (messages + matches + visites) ; POST → lastSeenNotificationsAt
```

⸻

## Ce qui est fonctionnel ✅

Auth (Google + Apple + email/bcrypt), onboarding multi-étapes, paiement Stripe 3 offres (checkout + webhook + MongoDB), Mon Compte, API profil GET/PUT, découverte /explorer (like/pass/match), likes & matches, messagerie temps réel Pusher, mode fantôme (premium), Circle of Six, VibeSphere, journal émotionnel MongoDB, VibePlanner, VibeMentor, événements, communauté (forum), visiteurs de profil, notifications, dashboard admin, newsletter, témoignages (validation admin), signalements, pages légales, SEO complet, upload Cloudinary, emails Resend, Stripe Identity, rate limiting Upstash, audit logs, filtre anti-harcèlement (text-moderation + Report auto), badges vérification identité, relances email cron (CRON_SECRET), Vercel Analytics, consentement cookies RGPD, tests Vitest, gestion abonnement (annulation/pause/réactivation), webhooks invoice, PayPal/Apple Pay/Google Pay, sync manuel abonnement. Build Next.js validé.

⸻

## Conventions de code

* **Langue UI : français.** Communication, commits, copy produit en français.
* Types partagés cohérents avec `src/models/User.ts`.
* Connexion MongoDB : toujours via `connectDB()` depuis `src/lib/db.ts`.
* Accès session serveur : `getServerSession(authOptions)`.
* **Palette (nouvelle — éclipse solaire)** : `abyss #001724`, `teal #15676D`, `cream #FFEBD1`, `orange #FF7A00`, `rust #79280E`. (Remplace les violets/roses de SferaLuna — voir rebranding.)
* Pages sombres : `<Footer />` reste en dehors du wrapper `text-white`/`text-cream`.
* Padding top avec header fixe : `pt-24` minimum.
* Mobile : réduire les gros `py`, `text-2xl`/`text-3xl`, cards compactes, longs contenus en accordéon, éviter les grilles trop larges, boutons principaux `w-full`.
* Accessibilité : focus clavier visible, `prefers-reduced-motion` respecté, contraste suffisant (attention orange/teal).
* `subscription-check.ts` utilise getServerSession + Mongoose → **jamais** dans le middleware Edge racine.

⸻

## 🔁 Rebranding SferaLuna → Sfera'Solys (à faire)

- [ ] `CLAUDE.md` — fait (ce fichier)
- [ ] `README.md` — réécrire
- [ ] `PROMPT_APP_MOBILE.md` — adapter
- [ ] `auth.config.backup.js` — vérifier / nettoyer / supprimer
- [ ] `.npmrc` — retirer tout token privé hérité (commit « passe dediee » côté SferaLuna)
- [ ] `sferaluna-app-icon-1024.png` — remplacer par l'icône Sfera'Solys (soleil éclipse)
- [ ] **Base MongoDB** : `dbName` `sferaluna` → `sferasolys` (chercher dans `src/lib/db.ts`, `scripts/`)
- [ ] **Palette** : remplacer `#1a0b2e / #2d1b69 / #3a2a82`, gradients `purple-600 → pink-600`, `#faf9ff / #f0ecff / #8E7AB5 / #5B4B8A` par les tokens éclipse solaire
- [ ] **Fonts** : brancher Archivo / Fraunces / Instrument Sans (next/font/google)
- [ ] **Modèle** `LunaEvent.ts` → `SolysEvent.ts` (+ imports, + libellés « Événements Luna »)
- [ ] **Copy** : toute occurrence « SferaLuna » / « Luna » dans pages, métadonnées SEO, emails, OpenGraph
- [ ] **Critère d'inscription / cible** : orienter la copy et les visuels hommes 28+
- [ ] **OAuth** : nouveau projet Google Cloud + Services ID Apple pour le domaine Sfera'Solys (redirect URIs, `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` alignés sur le domaine canonique — attention au piège `www` / non-`www` vu sur SferaLuna)
- [ ] **Domaine** : sferasolys.fr/.com + déploiement Vercel séparé
- [ ] **Secrets** : régénérer MongoDB, Stripe (produits + prix + webhook), Pusher, Cloudinary, Resend

> Vérifs utiles pendant le rebranding :
> ```bash
> grep -Rni "sferaluna" src public scripts *.md *.json *.js *.ts
> grep -Rni "luna" src/models src/app | grep -vi "vibe"
> grep -Rn "1a0b2e\|2d1b69\|3a2a82\|8E7AB5\|5B4B8A\|purple-600\|pink-600" src
> ```

⸻

## Commandes utiles

```bash
npm run dev            # développement
npm run build          # build
npm test               # tests unitaires Vitest
npm run test:watch     # tests watch
npm run test:coverage  # tests + couverture

git add . && git commit -m "..." && git push origin main
```

⸻

## ⚠️ Notes

* `npm install` remonte des vulnérabilités héritées de SferaLuna (1 critique, 9 hautes au fork). **Ne pas** lancer `npm audit fix --force` à l'aveugle (risque de casser des majeures) — traiter posément après stabilisation.
* Dette technique de SferaLuna : aucune bloquante connue au moment du fork (voir historique SferaLuna pour le détail des corrections déjà appliquées : index Mongoose, ProfileView→ProfileVisit, rate-limiter natif, journal MongoDB, params Next.js 15 en Promise, etc.).