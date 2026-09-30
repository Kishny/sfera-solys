# Déploiement — Sfera'Solys

Guide du premier déploiement sur Vercel, puis de l'activation des services un
par un. Il est écrit dans l'ordre où les choses se font.

---

## 1. Le principe : rien n'est bloquant sauf quatre variables

Le projet démarre avec **quatre** variables. Tout le reste — Stripe, Resend,
Pusher, Cloudinary, Google, Apple, Upstash — peut rester vide : le service
concerné se déclare indisponible et le site fonctionne sans lui.

> **Ordre des opérations.** Le tout premier `vercel --prod` peut se lancer
> sans aucune variable : le build passe, le site s'affiche, et les pages qui
> lisent des données signalent l'absence de base. C'est ce qui permet de
> récupérer l'URL de production, dont `NEXTAUTH_URL` et `NEXT_PUBLIC_APP_URL`
> ont besoin. On pose les quatre variables ensuite, puis on redéploie.

Ce n'était pas le cas avant le 29/09/2026. `src/lib/resend.ts` construisait
son client à l'import, et **le constructeur de Resend lève quand la clé
manque** : oublier `RESEND_API_KEY` sur Vercel ne donnait pas un site sans
e-mails, ça donnait un build qui échoue. `src/lib/stripe.ts` levait aussi, sur
un message parlant de `.env.local` — qui n'existe pas sur Vercel. Les deux
sont corrigés — ainsi que `src/lib/db.ts`, qui levait de la même façon et a
fait échouer le premier déploiement réel sur
`Failed to collect page data for /api/admin/reports/[id]`.

Vérification faite **en écartant `.env.local`**, sans quoi le test ne prouve
rien : `next build` lit ce fichier sur le disque, et un simple `env -u` ne
l'empêche pas. Build lancé sans aucune variable, comme sur un projet Vercel
vierge : 83 pages générées, avec des messages nommant la variable manquante et
l'endroit où la poser.

> **Un placeholder n'est pas une configuration.** Toutes les gardes passent
> par `src/lib/configuration.ts`, qui écarte aussi bien une variable absente
> qu'une variable laissée à `A_REMPLACER`. Laisser un placeholder dans Vercel
> revient exactement à ne rien mettre — c'est voulu.

---

## 2. Les quatre variables du premier déploiement

| Variable | Valeur | Pourquoi |
|---|---|---|
| `MONGODB_URI` | la chaîne de connexion Atlas | sans elle, aucune page qui lit des données ne fonctionne |
| | | *le nom de la base est donné en dur à `mongoose.connect` (`dbName: "sferasolys"`) : inutile de l'ajouter à l'URI* |
| `NEXTAUTH_SECRET` | une valeur aléatoire longue — `openssl rand -base64 32` | signe les jetons de session |
| `NEXTAUTH_URL` | l'URL **exacte** du site en production | sans elle, la connexion échoue en ligne |
| `NEXT_PUBLIC_APP_URL` | la même URL | sinon les URL canoniques, le `sitemap.xml`, le `robots.txt` et les balises Open Graph pointent tous vers `https://sferasolys.com`, codé en dur comme valeur de repli |

> **Les deux URL doivent commencer par `https://`, sans espace.** C'est la
> cause des deux premiers échecs de déploiement réels de ce projet.
> `NEXT_PUBLIC_APP_URL` alimente `new URL(...)` dans `metadataBase` ; et
> `parseUrl` de next-auth préfixe `NEXTAUTH_URL` par `https://` quand le
> schéma manque, si bien qu'une valeur comportant une espace devient
> `https:// mon-site.app` — que `new URL` refuse. Le build s'arrête au
> prérendu de `/_not-found`, et si la variable est marquée « Secret », le
> journal masque la valeur : plus rien ne désigne la coupable. Les poser en
> **Config**, pas en Secret : ce sont des adresses publiques, et une
> `NEXT_PUBLIC_*` finit de toute façon dans le JavaScript du navigateur.

Les deux dernières sont à corriger **le jour où un domaine personnalisé est
branché**. Tant qu'elles pointent ailleurs, le site se référence lui-même à
une adresse qui n'est pas la sienne.

### Côté MongoDB Atlas

Les fonctions Vercel n'ont pas d'adresse IP fixe. Dans **Network Access**,
autoriser `0.0.0.0/0`, ou passer par l'intégration Vercel d'Atlas. Sans ça la
connexion échoue en ligne alors qu'elle marche en local — le symptôme est un
`querySrv ENOTFOUND` ou un délai d'attente sur toutes les routes.

### Côté Vercel

Stripe exige un site « accessible et non protégé par un mot de passe » pour
valider le compte. Les déploiements **preview** sont protégés par défaut sur
certains plans : donner l'URL de **production**, et vérifier
**Settings → Deployment Protection**.

---

## 3. Activer les services, un par un

Chaque bloc est indépendant. Tant qu'il n'est pas renseigné, la fonctionnalité
se signale indisponible — une fois au démarrage dans le journal, et par un
`503` explicite côté interface.

### Stripe — paiements et vérification d'identité

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ESSENTIAL_MONTHLY
STRIPE_PRICE_PREMIUM_MONTHLY
STRIPE_PRICE_ELITE_MONTHLY
```

Sans ces clés : `/paiement` répond 503, la vérification d'identité aussi — et
comme l'accès au compte en dépend, **personne ne peut aller au bout de
l'inscription**. C'est le service à activer en premier.

Le webhook se déclare dans Stripe sur `https://<le-site>/api/stripe/webhook`.
Le secret renvoyé par Stripe est `STRIPE_WEBHOOK_SECRET` — sans lui, les
paiements aboutissent chez Stripe mais le compte n'est jamais mis à jour.

### Resend — e-mails

```
RESEND_API_KEY
RESEND_FROM_EMAIL
RESEND_AUDIENCE_ID
```

Sans ces clés : aucun e-mail ne part — vérification d'adresse, réinitialisation
de mot de passe, relances, newsletter. Le formulaire de contact répond 503,
parce que c'est la seule voie de recours affichée sur le site et qu'accuser
réception d'un message qui n'ira nulle part serait pire que de le refuser.

### Cloudinary — photos

```
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_MODERATION_ENABLED   (optionnel)
```

Sans ces clés : les trois routes d'envoi répondent 503. Les profils
fonctionnent, sans photo.

### Pusher — temps réel

```
PUSHER_APP_ID
PUSHER_KEY
PUSHER_SECRET
PUSHER_CLUSTER              (défaut : eu)
NEXT_PUBLIC_PUSHER_KEY      (même valeur que PUSHER_KEY)
NEXT_PUBLIC_PUSHER_CLUSTER  (défaut : eu)
```

Sans ces clés : les messages sont enregistrés et lus normalement, ils
n'arrivent simplement pas tout seuls. `/api/pusher/auth` répond 503.

### Google et Apple — connexion tierce

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
APPLE_ID / APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY
```

NextAuth n'enregistre ces fournisseurs que si leurs variables existent, et la
page de connexion n'affiche que les boutons réellement branchés — elle lit
`/api/auth/providers` pour le savoir. Rien à faire côté interface.

URL de retour à déclarer chez le fournisseur :
`https://<le-site>/api/auth/callback/google` (et `.../apple`).

### Upstash — limitation de débit partagée

```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Sans ces clés, le compteur reste en mémoire : correct en local, **insuffisant
en serverless**, où chaque instance a le sien. À activer avant d'ouvrir le
site au public.

### Tâches planifiées

`vercel.json` déclare trois crons (relances de match, digest du matin,
relances de renouvellement). Poser `CRON_SECRET` : Vercel envoie
automatiquement `Authorization: Bearer <CRON_SECRET>`, et les routes refusent
tout appel non signé. Sans la variable, les routes sont ouvertes.

### Divers

```
CONTACT_EMAIL              destinataire du formulaire de contact
GOOGLE_SITE_VERIFICATION   balise de vérification Search Console
```

---

## 4. À savoir avant de rendre le lien public

- `/admin` et `/paiement` sont **encore sur l'identité SferaLuna** (violets
  codés en dur). Rien de bloquant pour la validation Stripe, qui regarde les
  pages publiques, mais le lien ne devrait pas circuler avant leur migration.
- `/public/og-image.png` est un placeholder quasi vide : tout partage sur les
  réseaux affichera une image blanche.
- L'offre **Elite à 34,99 €** n'a aujourd'hui aucune fonctionnalité distincte
  face à Premium à 19,99 €, sinon 10 boosts au lieu de 3. À trancher avant
  d'ouvrir les paiements.

---

## 5. Vérifier un build sans casser le serveur de développement

`next dev` et `next build` écrivent tous les deux dans `.next`. Lancer une
vérification pendant que le serveur tourne écrase les fichiers qu'il sert.

```bash
NEXT_DIST_DIR=.next-verif npx next build
```
