# Sfera'Solys — CLAUDE.md

Site de rencontre premium français. Orientation : sécurité, authenticité, expérience masculine. **Cible : hommes 28 ans et plus.**

Sfera'Solys est le **pendant masculin de SferaLuna** (Solys = solaire / Luna = lunaire). C'est un **fork séparé** : repo indépendant, base MongoDB distincte, **même moteur technique**, identité visuelle propre. Garder la structure de fichiers alignée sur SferaLuna pour faciliter les cherry-picks de correctifs entre les deux projets.

> ⚠️ Ce projet vient d'être forké depuis SferaLuna. Tant que le rebranding (section dédiée en bas) n'est pas terminé, du code, des libellés et des configs référencent encore « SferaLuna » / « Luna » / la base `sferaluna`. Ne jamais réutiliser les secrets de SferaLuna : toutes les clés (MongoDB, Stripe, Pusher, Cloudinary, Resend, Google, Apple) doivent être régénérées pour Sfera'Solys.

⸻

## Comment utiliser ce fichier

**Ce fichier est la source de vérité du projet.** Direction artistique, conventions,
état d'avancement, pièges connus : tout se décide et se consigne ici, pas dans les
instructions de projet côté claude.ai, qui ne doivent contenir qu'un renvoi à ce
fichier. Deux sources qui décrivent la même règle finissent toujours par diverger —
c'est arrivé le 27/09/2026 avec le bas-de-casse, retiré du code et resté dans les
instructions.

En pratique, pour toute session de travail sur ce projet :

1. **Lire ce fichier en entier avant de toucher au code.** Les sections « État
   intermédiaire assumé » et « Reste à faire » évitent de prendre une migration en
   cours pour un bug, et de refaire un travail déjà fait.
2. **Vérifier plutôt que supposer.** `tsc` tourne sur la machine (section
   Vérification), les ratios de contraste se calculent (section Direction
   artistique), et un rendu se regarde avant d'être livré.
3. **Consigner ici ce qui a été fait**, avec la date, dans le journal de rebranding
   plus bas — en incluant les erreurs commises et ce qu'elles ont appris. Un
   journal qui ne garde que les réussites ne sert à rien : les angles morts
   documentés (« Luna » seul, `globals.css`, les chaînes à gabarit) ont tous été
   trouvés parce que le précédent avait été écrit.

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

Palette (tokens Tailwind) — **mise à jour : concept 5 retenu (« lime & vulcanico »)**, 25/09.

Après plusieurs maquettes comparées (voir la maquette de comparaison, artifact `https://claude.ai/artifact/2TD2kNDoqzXgHKCu4G5kxK`), l'utilisateur a validé une palette plus électrique. Astuce technique retenue : **les clés Tailwind ne changent pas** (`abyss/teal/cream/orange/rust`, alias `background/surface/text/accent/accent-deep`) — seules leurs **valeurs hex** ont changé dans `tailwind.config.js`, ce qui fait hériter tout le code existant (176 usages / 19 fichiers au moment du changement) sans renommer une seule classe. Nouveau token ajouté : `lime` / `accent-electric`.

| Token       | Hex       | Rôle                                                  |
|-------------|-----------|--------------------------------------------------------|
| `abyss`     | `#04202E` | fond principal — éclairci le 29/09/2026, était `#001724` |
| `cream`     | `#FFEBD1` | texte sur fond sombre (inchangé)                        |
| `orange`    | `#FF4103` | **vulcanico** — accent principal, CTA, liens (remplace l'ancien `#FF7A00`) |
| `rust`      | `#6B1B02` | **ember** — déclinaison sombre du vulcanico, hover/pressé (remplace l'ancien `#79280E`) |
| `teal`      | `#123243` | surface des cartes, un cran au-dessus du fond — éclairci le 29/09/2026, était `#0C222D` (et avant lui `#15676D` : la teinte teal est retirée, seul le rôle « surface plus claire que le fond » est gardé) |
| `lime`      | `#B6FF00` | **nouveau** — accent électrique secondaire, réservé aux petites touches à fort impact (badges, points de statut, glows) — jamais en grande surface ni en texte courant |

> Dette de nommage assumée (documentée en commentaire dans `tailwind.config.js`) : le code dit encore `bg-teal`/`text-rust` alors que ça ne rend plus du tout du teal/rust. À nettoyer (renommer les classes) au fil de la migration page par page, cf. section Restructuration ci-dessous.

Ancienne palette (concept 1, abandonnée) pour mémoire : `orange #FF7A00`, `teal #15676D`, `rust #79280E` — restait trop proche de SferaLuna visuellement.

Typographie :

* Display : **Archivo** (largeur expanded ~125), capitalisation française
  normale — capitale initiale sur les titres, libellés et boutons. Le
  bas-de-casse systématique a été retiré le 27/09/2026 : il aplatissait les
  noms propres et privait lecteurs d'écran, moteurs de recherche et aperçus
  de partage d'un texte correct.
* Accent  : **Fraunces** italique (touches éditoriales / chaleur)
* Corps   : **Instrument Sans** (400 / 500 / 600)

Signature de marque — **logo officiel** :

* Anneau d'éclipse : anneau orange (`#FF7A00`) mordu sur sa droite par un anneau teal plus fin (`#15676D`), dégradé orange → teal à la jonction des deux, fond intérieur crème (`#FFEBD1`). Répond visuellement à la lune de SferaLuna, en version anneau plutôt que disque plein.
* Deux points teal en orbite sur le bord de l'anneau (un plus grand en haut à droite, un plus petit en bas à gauche), reliés par un arc pointillé teal.
* Au centre : un soleil stylisé — disque orange avec 10 rayons triangulaires, dégradé orange → teal sur les rayons du cadran supérieur droit.
* Une vague abyss (`#001724`) au tracé fluide et organique recouvre le quart inférieur gauche du soleil — effet horizon marin / éclipse, pas de bord dentelé.
* Style : flat vector, aucune ombre portée, aucun rendu 3D, fond transparent.
* Deux déclinaisons : l'**emblème seul** (sans texte, pour favicon / app icon, déclinable jusqu'à 1024px) et le **lock-up complet** (emblème + wordmark « sfera'solys » centré juste en dessous, à la manière du logo SferaLuna), utilisé pour le header, le footer et les supports de marque.
* Dans le wordmark, l'apostrophe entre « sfera » et « solys » est rendue comme un **point solaire orange** plutôt qu'une apostrophe typographique classique.

Prompt de génération de référence (pour régénérer ou décliner le logo auprès d'un outil d'image IA) — version lock-up complet avec texte :

```
Minimalist flat vector logo, vertical lock-up: a circular emblem centered on top, with the wordmark directly below it.

Emblem — circular badge combining a sunburst and an ocean wave in a solar-eclipse composition. Ring: two overlapping circular rings forming an eclipse effect — a solid orange ring (#FF7A00) covering most of the circle, overlapped on the right side by a thinner teal ring (#15676D), as if one disc is biting into the other, with the ring subtly gradient-shifting from orange to teal where they meet. Inside the ring, a soft cream background (#FFEBD1). Accents: two small solid teal dots (#15676D) — one larger, sitting exactly on the outer edge at the top right, one smaller at the bottom left — connected by a thin dotted teal arc tracing part of the ring's outer edge. Center icon: a stylized sun — a solid orange circle (#FF7A00) with 10 elongated triangular rays radiating outward evenly, the rays on the upper-right subtly gradient-shifting from orange to teal. Foreground: a smooth, organic deep navy wave shape (#001724) overlapping the lower-left portion of the sun, like an ocean horizon crossing the sun at sunset/sunrise — the wave edge is a single fluid curved swirl, not jagged.

Wordmark — directly beneath the emblem, the text "Sfera'Solys" with an initial capital on each word, bold geometric sans-serif letterforms, wide letter-spacing (expanded/extended width style, similar to Archivo Expanded), all in deep navy (#001724) — except the apostrophe between "Sfera" and "Solys", which is replaced by a small solid orange dot (#FF7A00) instead of a typographic apostrophe mark. Wordmark width roughly matches the emblem's width, centered, with clear even spacing between emblem and text.

Style: clean flat vector, geometric precision, smooth curves, pure flat matte color fills only — no gradients other than the two orange→teal transitions explicitly described above, no shading beyond that, no drop shadows, no 3D bevels, no glass or metallic/chrome material, no specular highlights, no glow or bloom effects, no additive light-on-black rendering, no photorealism, no texture noise, no sci-fi HUD grid lines, no tick marks, no gibberish text or fake technical labels, no additional decorative elements outside the shapes described above. The wordmark capitalises the S of "Sfera" and the S of "Solys", the rest lowercase, no generic tech/sci-fi font — a clean geometric expanded sans-serif only. Premium, modern, elegant branding for a men's dating platform — think refined jewelry-brand minimalism, not sci-fi gadget or video-game UI.

Format: vertical lock-up composition (emblem above, wordmark below), centered, transparent background, portrait canvas proportions (e.g. 3:4), ultra high resolution, crisp clean vector edges. The artwork must be pure flat matte color fills so it composites cleanly as a transparent PNG on both light and dark backgrounds — nothing in the design should rely on a black backdrop to look correct.
```

STRICTLY AVOID (à coller en fin de prompt si l'outil accepte un bloc dédié) :

```
STRICTLY AVOID: 3D chrome rendering, glass/metallic material, specular highlights, glow or bloom effects, drop shadows, additive light-on-black rendering, sci-fi HUD grid lines, tick marks, gibberish text or fake technical labels, capital letters in the wordmark, generic tech/sci-fi font. The artwork must be pure flat matte vector color fills only — it needs to composite cleanly as a transparent PNG on both light and dark backgrounds.
```

Negative prompt (si l'outil le permet) : `watermark, photorealistic, 3D render, chrome, glass, metallic material, specular highlight, glow, bloom, drop shadow, bevel, gloss, additive lighting, HUD grid, tick marks, gibberish text, fake labels, extra colors, background scenery, human face, noisy gradient, low resolution, serif font, script font, sci-fi font, capital letters, extra punctuation marks`

> Pour la version **emblème seul** (favicon / app icon, sans texte), reprendre le même prompt en retirant tout le paragraphe « Wordmark » et en repassant le Format en `1:1 square aspect ratio, app-icon ready` — c'est la version documentée précédemment dans ce fichier avant cette mise à jour.

Règles d'usage couleur :

* L'orange (vulcanico `#FF4103`) est l'accent principal : CTA, liens, gros éléments, icônes. **Jamais** de petit texte orange sur `teal`/`surface` (contraste insuffisant, règle héritée de l'ancienne palette, toujours valable avec les nouvelles valeurs).
* `lime` (`#B6FF00`) est l'accent électrique secondaire : petites touches à fort impact uniquement (badges « nouveau », points de statut, glows, micro-interactions). Jamais en grande surface, jamais en corps de texte — un aplat lime en fond fatiguerait l'œil.
* Texte courant sur fond sombre = `cream`. Texte secondaire = cream désaturé/opacité.
* `rust` (ember `#6B1B02`) pour les hovers du primaire et les états chauds (erreurs douces, badges).

### Le motif d'éclipse : la géométrie décide si on lit un soleil ou une lune

Composant : `src/components/brand/EclipseMark.tsx`. Un disque plein creusé par un disque occultant (masque SVG, donc centre réellement transparent — le motif reste juste sur `abyss` comme sur une carte `#123243`).

**Le piège, constaté au rendu et pas dans le code :** si le disque occultant est trop décalé, le résultat n'est pas une éclipse, c'est un **croissant de lune** — donc le symbole de SferaLuna, l'exact inverse de ce que Solys raconte. La première version (disque r=68 mordu par un disque r=68 décalé de ~41) affichait un croissant lunaire géant en haut de la page d'accueil, sur desktop comme sur mobile.

La règle : **c'est l'épaisseur minimale de l'anneau qui décide de la lecture.** Anneau continu = soleil ; anneau réduit à un fil = lune. Géométrie retenue : disque `r=68` centré en (100,100), occultant `r=52` centré en (106,95) — l'anneau varie de 8 à 24 px, il reste lisible comme un disque solaire occulté tout en gardant l'idée de morsure de la charte. La couronne (`withCorona`) ajoute 12 rayons courts qui verrouillent la lecture solaire.

**Leçon de méthode :** ce défaut était invisible en lisant le code et évident en une seconde à l'écran. Pour tout travail décoratif, faire un rendu (page HTML statique reprenant les classes + capture Playwright) avant de livrer.

### Rôle des deux accents : orange = action, lime = validation

Constat du 25/09 : sur les pages migrées, le rapport était d'**un lime pour six à sept oranges**, et `/temoignages` n'en avait aucun. Le lime était devenu décoratif au lieu d'être signifiant.

La cause n'était pas la quantité mais l'absence de rôle. Règle adoptée :

* **orange (vulcanico)** = l'action — fond des boutons, couleur des liens, accents de titre ;
* **lime** = la validation — coches, badges « vérifié », garanties, états de succès, étapes franchies, et **les états d'interaction** (liseré au survol, fin du dégradé de soulignement).

Le lime ne se montre donc pas au repos : il répond. C'est ce qui lui rend une présence régulière sans qu'il écrase l'orange — rappel du calcul de contraste : lime = 15,1:1 sur abyss contre 5,2:1 pour l'orange, soit près de trois fois plus lumineux. Étalé en aplat, il aspire l'attention et pousse l'ensemble vers un registre néon qui contredit le ton institutionnel de la direction A.

### Système d'interactions (`fx-*`, dans `globals.css`)

Quatre classes, définies en CSS dans un `@layer components` plutôt qu'en chaînes Tailwind répétées : un effet d'interaction doit être identique partout et réglable en un seul endroit. Elles s'ajoutent **à côté** des classes Tailwind, qui continuent de porter couleur et espacement.

| classe | pour | survol | appui |
| --- | --- | --- | --- |
| `fx-btn` | bouton plein | élévation 2px, halo orange, liseré lime, balayage de lumière | enfoncement + `scale(.985)`, liseré lime renforcé |
| `fx-ghost` | bouton contour | élévation, bordure orange, fond orange très léger | enfoncement, bordure lime |
| `fx-link` | lien texte | soulignement orange→lime qui se déploie depuis la gauche, flèche qui avance | opacité réduite |
| `fx-card` | carte cliquable | élévation 4px, bordure orange, liseré lime | léger retour |

Le soulignement se déploie depuis la gauche et se **replie vers la droite** quand le curseur s'en va (`transform-origin` inversé entre les deux états) : le trait suit le mouvement du regard au lieu de disparaître d'un coup.

**Deux pièges rencontrés, à retenir :**

1. **Tailwind élague le contenu de `@layer components`** selon ce qu'il détecte dans `content`. Les classes `fx-*` ne survivent au build que parce qu'elles apparaissent littéralement dans des fichiers `src/**/*.tsx`. Ne jamais les construire dynamiquement.
2. **Poser des classes par motif exige de vérifier le type d'élément.** Le script d'application, qui reconnaissait les chaînes de classes, a posé `fx-link` sur un `<p>`, un `<th>` et un `<dt>`, et `fx-ghost` sur trois `<input>` — soit un soulignement au survol sur du texte non cliquable et des champs de saisie qui se soulèvent. 8 faux positifs, détectés en remontant à la balise ouvrante de chaque occurrence. Contrôle à refaire après tout traitement de ce genre : compter les `fx-*` posées sur autre chose que `<a>`, `<Link>` ou `<button>` — le compte doit être nul.

### Règles de contraste (calculées, pas estimées — mises à jour le 29/09/2026)

Ratios WCAG réels de la palette, sur le fond `abyss #04202E` et la surface de
carte `#123243`. **Les valeurs ont changé le 29/09** avec le palier de
luminosité : le fond est passé de `#001724` à `#04202E`, la surface de
`#0C222D` à `#123243`. Tout ce qui est en crème y gagne en confort ; l'orange,
lui, y perd — c'est le prix du palier, et il est assumé.

| combinaison | ratio | verdict |
| --- | --- | --- |
| `cream` sur `abyss` | 14,4:1 | ✅ |
| `cream` sur `#123243` | 11,6:1 | ✅ |
| `cream/70` sur `abyss` | 7,6:1 | ✅ |
| `cream/60` sur `abyss` | 5,9:1 | ✅ |
| `cream/55` sur `abyss` | 5,2:1 | ✅ plancher à respecter |
| `cream/50` sur `abyss` | 4,5:1 | ⚠️ pile sur le seuil, à éviter |
| `cream/45` sur `abyss` | 3,9:1 | ❌ |
| `orange` sur `abyss` | 4,8:1 | ✅ de justesse (5,2:1 avant le palier) |
| **`orange` sur `#123243`** | **3,8:1** | ❌ **ne passe plus en petit texte** (4,7:1 avant) |
| `lime` sur `abyss` | 13,8:1 | ✅ |
| **`cream` sur `bg-orange`** | **3,0:1** | ❌ **échoue sur tous les boutons pleins** |
| **`abyss` sur `bg-orange`** | **4,8:1** | ✅ **c'est la combinaison à utiliser** |
| `abyss/90` sur `bg-orange` | 4,5:1 | ⚠️ pile sur le seuil |
| `abyss/70` sur `bg-orange` | 3,6:1 | ❌ |
| `cream` sur `bg-lime` | 1,0:1 | ❌ invisible, le lime ne porte que de l'abyss |
| `cream` sur `rust` | 10,1:1 | ✅ |

Trois règles qui en découlent, appliquées partout dans les fichiers migrés :

1. **Un bouton plein orange porte du texte `abyss`, pas `cream`.**
   `bg-orange text-cream` ne passe qu'en très gros texte (≥ 18,66 px gras) ;
   nos libellés de CTA sont en 12-14 px, donc non conformes. C'est
   contre-intuitif parce que les maquettes utilisaient du crème sur orange —
   la maquette avait tort, le calcul a raison. Et depuis le palier, `abyss`
   n'a plus que 4,8:1 de marge : ne pas l'affaiblir en `abyss/90` ou moins.
2. **Plancher `cream/55` pour tout texte.** `/50`, `/45`, `/40`, `/35` et
   `/30` sont interdits sur du texte, compteurs, mentions légales et
   placeholders compris. En dessous, réserver aux bordures et aux aplats de
   surface, où le seuil ne s'applique pas.
3. **L'orange n'est pas une couleur de texte courant.** Sur le fond il tient
   encore (4,8:1), sur une carte il ne tient plus (3,8:1) — et une carte peut
   se retrouver n'importe où. Un lien ou un bouton fantôme se libelle en
   `cream` ; l'orange reste dans la bordure, dans l'icône et dans le
   soulignement `.fx-link` qui se déploie au survol. Il garde en revanche
   toute sa place en aplat (boutons pleins), en gros titre et en pictogramme,
   où le seuil applicable est 3:1.

Le script de calcul est trivial à refaire : luminance relative +
`(L1+0,05)/(L2+0,05)`, en aplatissant d'abord l'opacité Tailwind sur la
couleur de fond réelle — c'est cette étape d'aplatissement qui manque à la
plupart des vérifications à l'œil.

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
│   ├── mon-compte/page.tsx                   ← Dashboard compte ✅
│   │   └── _composants/                      ← types.ts + un composant par onglet
│   ├── paiement/page.tsx                     ← Choix offre Stripe
│   ├── profil/[id]/page.tsx                  ← Profil public ✅
│   ├── entraide/page.tsx                     ← Entraide entre membres ✅
│   ├── sitemap.ts / robots.ts               ← SEO
│   ├── layout.tsx / layout-meta.ts          ← RootLayout + helper buildMeta
│   ├── accessibilite|confidentialite|conditions|cookies/
│   └── [marketing] commencer, equipe, faq, fonctionnalites, guide, histoire, tarifs, valeurs
├── components/  Header.tsx, Footer.tsx, CookieConsent.tsx, NewsletterSignup.tsx, JsonLd.tsx,
│                ReportModal.tsx, UsageLimits.tsx, ui/ (Button, Logo, VerifiedBadge, ProfileCard, Sun),
│                testimonials/ (TestimonialsCarousel, TestimonialCard, StarRating, TestimonialForm,
│                TestimonialsExplorer, TestimonialSubmitSection)
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
* **Palette (concept 5 — « lime & vulcanico »)** : `abyss #04202E`, `cream #FFEBD1`, `orange #FF4103` (vulcanico), `rust #6B1B02` (ember), `teal #123243` (surface), `lime #B6FF00` (nouveau, accent électrique). Remplace les violets/roses de SferaLuna — voir rebranding et section Restructuration.
* Pages sombres : `<Footer />` reste en dehors du wrapper `text-white`/`text-cream`.
* Padding top avec header fixe : `pt-24` minimum.
* Mobile : réduire les gros `py`, `text-2xl`/`text-3xl`, cards compactes, longs contenus en accordéon, éviter les grilles trop larges, boutons principaux `w-full`.
* Accessibilité : focus clavier visible, `prefers-reduced-motion` respecté, contraste suffisant (attention orange/teal).
* `subscription-check.ts` utilise getServerSession + Mongoose → **jamais** dans le middleware Edge racine.

⸻

## 🔁 Rebranding SferaLuna → Sfera'Solys — journal (dernière entrée : 27/09/2026)

### Fait ✅

- [x] `CLAUDE.md` — tenu à jour au fil du chantier (ce fichier)
- [x] **Fondations** : tokens Tailwind (`abyss/teal/cream/orange/rust`), fonts Archivo/Fraunces/Instrument Sans branchées (`next/font/google`), 5 composants UI de base (`Button`, `Logo`, `VerifiedBadge`, `ProfileCard`, `Sun`)
- [x] **Base MongoDB** : `dbName` `sferaluna` → `sferasolys` (`src/lib/db.ts`)
- [x] **`.env.local`** : nouveau cluster MongoDB connecté, `NEXTAUTH_SECRET` régénéré, port dev/start passé à `3454`. Reste en placeholder `A_REMPLACER` : Google OAuth, Stripe (clé + webhook + 3 price IDs), Cloudinary, Pusher, Resend.
- [x] **Logo officiel** choisi par l'utilisateur (rendu illustré soleil + vague + anneau, style glossy — pas le flat vector d'abord proposé) + jeu complet d'icônes généré à partir de ce logo : `favicon.ico/16x16/32x32`, `apple-touch-icon.png`, `app-icon-1024.png`, `logo-icon.png` (emblème transparent, header/footer), `logo-icon-192/512.png`, `maskable-icon-192/512.png`. Intégré dans `Header.tsx`, `Footer.tsx`, `layout.tsx` (metadata.icons + JSON-LD logo), `site.webmanifest`. ⚠️ Ce rendu ne compose proprement (sans halo gris) que sur fond sombre ou dans le crop serré déjà préparé — à garder à l'esprit pour toute nouvelle déclinaison.
- [x] **Copy + palette + style** rebrandés sur : `Header.tsx`, `Footer.tsx` (liens réseaux sociaux mis en `#` avec TODO — vrais comptes à créer), `CookieConsent.tsx`, `NewsletterSignup.tsx`, `TestimonialsCarousel.tsx` / `TestimonialCard.tsx` / `StarRating.tsx`, et **toute la page d'accueil** `src/app/page.tsx` (hero, section swipe déplacée + compactée, Notre ADN, Fonctionnalités, comparatif, Témoignages, CTA final, App mobile compactée). Photo du hero = placeholder `SolarMark` en attendant un vrai visuel masculin.
- [x] **`layout.tsx` métadonnées SEO** : `title`, `description`, `keywords` (« rencontres lesbiennes »/« rencontres WLW » retirés), `authors/creator/publisher`, `openGraph`, `twitter`, JSON-LD `organization` + `WebSite` — tout rebrandé masculin. `baseUrl` de repli passé à `https://sferasolys.fr`. Reste en placeholder à surveiller : le handle `twitter.creator: "@sferasolys"` (compte pas forcément créé, même logique que les liens sociaux du Footer) et `/public/og-image.png` (fichier image lui-même non régénéré, encore un placeholder quasi vide).
- [x] **`Header.tsx`** : badge « Hommes vérifiés 28+ » déplacé à `2xl:flex` (n'apparaît que sur grand écran), nav desktop + actions + burger mobile re-synchronisés sur le breakpoint `xl` (au lieu de `lg`, qui était trop étroit pour le contenu réel — cause du bug de chevauchement/liens masqués corrigé le 17/08).
- [x] **Palette → concept 5 (« lime & vulcanico »)** : `tailwind.config.js` (nouvelles valeurs hex + token `lime` ajouté), nettoyage des couleurs codées en dur dans `src/app/page.tsx` (art SVG décoratif, motif de fond, glows) et `TestimonialCard.tsx`. Détail complet dans la section Palette ci-dessus.
- [x] **`Sidebar.tsx` créé** (`src/components/Sidebar.tsx`) : nouvelle nav verticale persistante pour l'espace connecté (voir section Restructuration ci-dessous). Désormais branchée via `src/app/(app)/layout.tsx`.
- [x] **Restructuration, phases 1/3/4** (25/09/2026) : groupe de routes `(app)` + page pilote `/explorer` migrée, `Header.tsx` réécrit en nav direction A (mega-menus sobres, fond sombre, CTA en lien texte), home `src/app/page.tsx` réécrite en parcours narratif (1486 → ~330 lignes). Détail et état intermédiaire assumé : section Restructuration ci-dessous.
- [x] **4 pages publiques refondues** (25/09/2026) : `/tarifs` (894 → 551 l.), `/fonctionnalites` (1051 → 619 l.), `/commencer` (971 → 608 l.), `/temoignages` (195 → 240 l.) — identité sombre, structure direction A, **et rebranding réel** (ces 3 premières pages n'avaient jamais été touchées : violets codés en dur + copy au féminin, voir la section Audit ci-dessous). Métadonnées SEO des `layout.tsx` de `/tarifs`, `/fonctionnalites`, `/commencer` corrigées. Les composants de témoignages (`TestimonialCard`, `TestimonialsExplorer`, `TestimonialSubmitSection`, `TestimonialForm`, `StarRating`) ont reçu une prop `variant` `"light" | "dark"`, **`"light"` par défaut** pour ne rien casser sur `/valeurs` et `/circle`.
- [x] **Contraste corrigé partout** (25/09/2026) : deux combinaisons non conformes AA ont été trouvées par le calcul et corrigées dans tous les fichiers migrés — voir « Règles de contraste » dans la section Direction artistique.
- [x] **Nav : vrais mega-menus + accès clavier** (25/09/2026) : les sous-menus ne s'ouvraient qu'au survol (un `aria-expanded` posé, mais **aucun `onClick`** — inutilisable au clavier). Ils s'ouvrent maintenant au survol et au clic/Entrée, se ferment avec Échap **en rendant le focus au bouton déclencheur** et au clic extérieur. Les listes flottantes sont devenues des panneaux pleine largeur sous le header : deux colonnes de liens avec une description sous chacun, plus une colonne d'accroche à droite avec son CTA. Le panneau est rendu **en dehors** de la `<nav>` (sinon l'`overflow-hidden` du conteneur le rognait — même cause que le bug de liens masqués d'août, qui a donc pu être retiré). Ajout d'un indicateur de page active (barre orange sous l'entrée) et d'un **lien d'évitement** « aller au contenu » en premier élément focusable.
- [x] **Système visuel de marque** (25/09/2026) : nouveau dossier `src/components/brand/` avec `EclipseMark` (la signature de la charte, enfin présente dans le code — voir la section sur sa géométrie), `GrainOverlay` (grain à 3,5 %, rétabli après l'avoir supprimé un peu vite), `VerificationSeal` (sorti de page.tsx pour être réutilisable) et `InterfacePreviews` (aperçus illustrés du Circle of Six et de la vue annuaire). **Règle appliquée aux aperçus, à conserver : aucun visage, aucune identité** — pas de portrait de banque d'images, pas de prénom. Un site dont la promesse est « pas de faux comptes » ne peut pas illustrer sa promesse avec des visages de personnes qui n'en sont pas. (Révisé le 27/09/2026 : voir l'entrée du journal, les aperçus affichent désormais des données d'exemple assumées.)
- [x] **Accueil enrichi à 8 sections** (25/09/2026) : la version précédente ne parlait que de vérification, un visiteur ne pouvait pas savoir ce que fait le produit. Ajout de « et une fois vérifié ? » (4 fonctionnalités en aperçu, descriptions alignées sur /fonctionnalites pour éviter deux discours), « pourquoi 28 ans et plus ? » (le critère d'âge expliqué par les intentions, jamais par l'orientation) et une FAQ courte de 3 questions (réponses reprises de /faq et /tarifs). Corrigé aussi un défaut d'alignement du hero sur mobile (`items-start` + `text-center` donnait des blocs de largeurs irrégulières).

- [x] **Rebranding de fond — marque, SEO et e-mails** (25/09/2026) : **277 occurrences de « SferaLuna » dans 90 fichiers ramenées à 0** hors tests (les 3 fixtures de test ont été alignées). Points de levier traités :
  - `src/app/layout-meta.ts` — c'était le fichier clé : `siteName = "SferaLuna"` et un domaine de repli `sferaluna.com` alimentaient les métadonnées Open Graph et les URL canoniques de **toutes** les pages. Corrigé, plus les 13 `layout.tsx` qui appellent `buildMeta`, plus `sitemap.ts`.
  - **E-mails transactionnels** (`src/lib/emails.ts`, `newsletter.ts`, `resend.ts`) : en-tête violet → abyss, lune → soleil, cœurs violets → orange, liens `#8E7AB5` → ember `#6B1B02` (fort contraste sur fond clair), signature « Rencontrer au féminin, librement. » → « Chaque rencontre commence par un dossier vérifié. », adresse d'expédition de repli → `Sfera'Solys <contact@sferasolys.com>`. Le bouton principal est passé en orange plein avec **texte abyss**, pas crème (cf. règles de contraste).
  - **Copy genrée** corrigée sur `/conditions`, `/equipe`, `/guide`, `/valeurs`. Formulation retenue partout : la plateforme est **pour** des hommes de 28 ans et plus, sans jamais présumer de leur orientation ni du genre des personnes rencontrées. L'énumération d'inclusivité de `/valeurs` a été adaptée (« Hétérosexuel, gay, bisexuel, pansexuel ou en questionnement »), pas supprimée.

- [x] **Migration visuelle, 2e vague** (25/09/2026) : `/guide` (829 → 559 l.), `/faq` (665 → 592 l., **12 questions conservées sur 12**), `/auth` (connexion + inscription) et `/auth/reset-password`. `/auth` n'a **pas** été réécrite mais recolorée chirurgicalement — toute la logique (identifiants, OAuth Google/Apple, force du mot de passe, accordéons mobiles) est intacte ; c'était déjà une page sombre, donc un simple changement de teinte du violet vers l'abyss. Deux icônes **lune** y servaient de signature de marque (sur `/auth` et `/auth/reset-password`) : remplacées par le soleil.
- [x] **« Luna » seul — angle mort du premier balayage** (25/09/2026) : le balayage de marque ne cherchait que « SferaLuna », donc **52 occurrences de « Luna » seul dans 24 fichiers** avaient survécu : « profil Luna », « Événements Luna », « LunaGather », « Utilisateur Luna », « Membre Luna », « espace Luna », la classe CSS `.input-luna`, le repli `pseudonyme || "Luna"`, et un `Sfera<span>Luna</span>` dans l'admin que la recherche ne pouvait pas voir, la marque étant coupée en deux par une balise. 70 remplacements, il en reste 0. **À savoir : `models/User.ts` avait `default: "Utilisateur Luna"` — une valeur par défaut en base**, désormais « Membre Solys » ; les comptes déjà créés gardent l'ancienne valeur.

- [x] **`globals.css` — dernier angle mort du rebranding** (25/09/2026) : ce fichier n'avait jamais été touché et pilotait pourtant TOUTES les pages. Corrigés : fond de document `#0a0614` (violet-noir) → abyss, texte lavande → crème, sélection rose → vulcanique, variables `--lunavibe-purple/pink/dark` → tokens de la charte, **barre de défilement violette à pouce rose** → pilule fine orange→rust (bordure transparente + `background-clip: padding-box`, avec `scrollbar-color` pour Firefox), et le « fond étoilé » — un motif de nuit, signature de la marque d'origine — retourné en poussière solaire crème/vulcanico (classe `.stars` conservée, elle sert sur `/auth`, `/inscription`, `/paiement`).
  - Ajouts : `color-scheme: dark` (contrôles natifs et champs auto-remplis cessent d'être clairs sur fond sombre), `scrollbar-gutter: stable` (plus de décalage de mise en page entre page courte et longue), un `:focus-visible` global en filet de sécurité, un bloc `prefers-reduced-motion` couvrant tout le CSS, et un **indicateur de progression de lecture** de 2px piloté par `animation-timeline: scroll()` — zéro JavaScript, sous `@supports` donc sans effet là où ce n'est pas supporté.
  - Supprimé après vérification d'un usage nul dans tout le dépôt : `.input`, `.tag`, `.input-luna` et les 4 animations `.animate-*`.
  - **Piège rencontré, à retenir** : les couleurs des règles `::-webkit-scrollbar-*` sont écrites en **valeurs littérales**, pas en `var(--token)`. Les pseudo-éléments de barre de WebKit sont peints par un chemin de rendu distinct au support historiquement incertain des variables CSS ; une variable non résolue rendrait la barre invisible.

- [x] **Section « Comment ça marche » — parcours cliquable, puis compacté** (27/09/2026) :
  la liste plate des 4 étapes est devenue un parcours à deux colonnes (étapes à
  gauche en vrai `tablist`, panneau « dossier » à droite montrant son état à
  l'étape choisie). Trois itérations ont été nécessaires, chacune déclenchée par
  un retour : l'affordance manquait (ajout d'une barre d'accent, d'un chevron
  permanent et d'un trait de liaison qui se remplit), puis un pilotage au
  défilement a été essayé et **retiré** — il coûte de la hauteur par
  construction, les deux demandes étaient incompatibles. Version finale : clic
  seul, **617px au lieu de 841 (−26,6 %)**, stable de 1280 à 1920.
  - Réglages qui tiennent l'équilibre, à ne pas défaire sans mesurer :
    `lg:min-h-[300px]` sur le panneau (les 4 panneaux font 280 à 320px — sans
    plancher, le bas de la carte sautait de 40px au clic), `lg:self-center` +
    contenu centré (calée en haut, la carte pendait dans le coin), colonne de
    gauche élargie à `1.12fr` (sans ça les descriptions repassaient sur deux
    lignes en dessous de 1440px et le gain de hauteur fondait), et `w-full` sur
    les boutons d'étape — **un `<button>` se dimensionne sur son contenu même en
    `display:flex`**, donc chaque carte avait sa propre largeur.

- [x] **Retour à la capitalisation française** (27/09/2026) : le bas-de-casse
  systématique de la charte a été retiré, sur décision du porteur du projet.
  **204 changements** : la classe `lowercase` supprimée de ses 57 emplacements,
  42 titres d'affichage, 73 libellés (nav, cartes, badges, `aria-label`) et 28
  textes isolés recapitalisés, plus le nom de marque redevenu « Sfera'Solys »
  partout, logo compris. Noms propres normalisés au passage : Circle of Six,
  VibeSphere, VibeMentor, VibePlanner, FAQ.
  - **Laissé volontairement en minuscules** : les légendes de statistique posées
    sous un nombre (« 24 / ans »), les fragments de titre coupés par un `<span>`
    sur les pages non migrées (« Les piliers de notre *communauté* »), et les
    identifiants techniques (`name=`, slugs, adresses d'exemple).
  - **Pourquoi ça valait le détour** : le texte était écrit en minuscules *dans
    la source* dans 42 cas sur 44, pas seulement transformé par le CSS. Lecteurs
    d'écran, extraits Google et aperçus de partage recevaient donc « comment ça
    marche ». Si le bas-de-casse revient un jour, le faire **uniquement en CSS**,
    en gardant la source correctement capitalisée.
  - **Angles morts de l'inventaire, à reprendre pour tout balayage de copy** :
    les chaînes contenant une apostrophe (une regex qui exclut les deux types de
    guillemets les rate), les libellés d'un seul mot (un filtre anti-slug trop
    large les écarte), et les textes coupés par une interpolation
    (`dossier · étape {n} sur 4`), invisibles à toute regex qui interdit `{`.

- [x] **Aperçus d'interface remplis** (27/09/2026) : les vignettes en dégradé et
  les barres grises des aperçus « Circle of Six » et « Annuaire » ne disaient
  rien — elles ressemblaient à un écran en cours de chargement. Elles portent
  maintenant des **données d'exemple assumées** : âge, ville, intérêts en
  commun, distance. Deux garde-fous : les valeurs n'utilisent que des champs
  réellement présents dans `models/User.ts`, et la légende de chaque aperçu
  porte la mention « données d'exemple ». **Toujours pas de visage ni de
  prénom** — c'est cette ligne-là qui reste tenue.
  - **Piège rencontré, à connaître avant de toucher aux avatars** : la
    première version dessinait le disque solaire et son occulteur au même
    rayon, avec un fort décalage. Le rendu donnait six **croissants de lune** —
    le symbole de SferaLuna. Exactement le défaut déjà corrigé sur
    `EclipseMark` en septembre, refait par inattention. La géométrie qui tient :
    **occulteur plus petit que le disque** (6,6 contre 9,5) et décalage faible
    (≤ 0,3), ce qui laisse un anneau complet — une éclipse annulaire, donc un
    soleil. Une couronne en pointillé fin achève de lever l'ambiguïté. Regarder
    le rendu, jamais seulement le code : cette erreur est invisible à la
    lecture.
  - Le panneau « ton profil » du parcours d'accueil a reçu le même traitement,
    mais à la deuxième personne (« Ton profil / Photos, prénom, âge et ville ») :
    il montre le dossier du visiteur, pas celui d'un membre.

- [x] **Tunnel d'inscription et `/auth` migrés** (27/09/2026) : le bouton
  « Rejoindre » de la nav menait jusqu'ici dans l'ancien produit — 2 283 lignes
  sur 6 fichiers, 109 couleurs violettes codées en dur, **zéro token de
  marque**. Recoloration à la manière de `/auth` : identité changée, logique de
  validation (Zod), d'upload et de vérification Stripe Identity strictement
  intacte. **329 remplacements de classes, 0 classe héritée restante.**
  - **Vérification employée, à réutiliser pour toute migration visuelle** :
    comparer le « squelette » des fichiers avant/après — chaînes vidées et
    texte JSX retiré. Si le squelette est identique, aucune logique n'a bougé.
    Ça a confirmé ici que les seuls écarts étaient des phrases.
  - **Piège de contraste introduit puis corrigé** : les coches des cases
    passaient en crème sur des aplats orange et lime. Sur le lime, le rapport
    tombait à **1,04:1** — la coche était littéralement invisible. Sur un aplat
    d'accent, la coche et le texte vont en `text-abyss` (5,23:1 sur orange,
    15,06:1 sur lime). Les 4 boutons principaux, en dégradé orange→ember avec
    texte crème (3,0:1), sont passés à l'aplat orange + `text-abyss` déjà en
    place sur les pages migrées.
  - **`/auth` n'était migré qu'à moitié** : 55 classes héritées y subsistaient
    après la passe de septembre, invisibles parce que la page était déjà
    sombre. Traitées avec le même mapping.

- [x] **Tutoiement généralisé sur le parcours d'inscription** (27/09/2026) :
  tout le site tutoie (6 à 54 occurrences par page publique), mais le tunnel et
  `/auth` vouvoyaient intégralement — 82 occurrences, zéro tutoiement. Rupture
  de ton au moment exact de l'engagement. **119 remplacements**, conjugaisons
  comprises : « Complétez votre profil » → « Complète ton profil »,
  « Veuillez choisir » → « Choisis », « Vous devez avoir » → « Tu dois avoir ».
  - Le « vous » de `/fonctionnalites` qui désigne le couple (« des idées qui
    vous rassemblent ») a été conservé et désambiguïsé, pas tutoyé.
  - **Le piège de l'apostrophe a resservi** : en écrivant « toi et l'autre »
    dans une chaîne à guillemets simples, l'apostrophe a terminé la chaîne et
    cassé `/fonctionnalites` — 7 erreurs de syntaxe. Trouvé par `tsc` en une
    seconde. Le détecteur « lettre-guillemet-lettre » mentionné plus haut est
    en revanche inutilisable tel quel : il remonte 109 faux positifs (toutes
    les apostrophes légitimes des chaînes à guillemets doubles). **C'est `tsc`
    qui fait foi, pas le motif.**
  - Vérifié au passage : l'âge minimum du schéma Zod était déjà `.min(28)`.

- [x] **Bloc « à propos » refondu** (27/09/2026) : `/histoire` (841 → 452 l.),
  `/valeurs` (1039 → 364 l.), `/equipe` (590 → 237 l.) et `/contact`
  (485 → 336 l.) réécrits en direction A. Les quatre étaient encore
  intégralement SferaLuna : violets codés en dur, zéro token de marque, et
  des traces de genre ayant survécu au balayage (« prend soin les unes des
  autres », « Prête à rejoindre », « Sois parmi les premières », deux emojis
  lune). **Deux erreurs de types préexistantes ont disparu** avec la
  réécriture de `/valeurs` : le total passe de 26 à 24.

- [x] **`/contact` : le formulaire n'envoyait rien** (27/09/2026). Son
  `handleSubmit` attendait 1,2 s avec un `setTimeout` puis affichait
  « Message envoyé ! 🎉 » ; un commentaire disait « à remplacer par un vrai
  fetch plus tard ». Tout message écrit par un visiteur était perdu, et le
  site lui affirmait le contraire. **Route `POST /api/contact` créée** :
  validation des champs, limitation à 5 messages / 10 min / IP (même règle
  que la newsletter), envoi via Resend avec `replyTo` sur l'expéditeur.
  - ⚠️ `RESEND_API_KEY` est encore un placeholder : la route répond alors
    **503 avec un message explicite** et la page affiche l'adresse de support
    en repli. C'est volontaire — mieux vaut dire « pas encore activé » que
    faire semblant. À retester une fois la clé renseignée.

- [x] **Contenu écrit, à relire par le porteur du projet** (27/09/2026) : le
  récit de `/histoire`, les six valeurs et les cinq engagements de
  `/valeurs`, les quatre pôles de `/equipe`. Règles que je me suis données
  et qu'il vaut mieux garder :
  - **Aucune date inventée.** La chronologie héritée (« Printemps 2024 »,
    « Été 2024 »…) a été **supprimée** plutôt que transposée : elle
    appartient à l'autre projet. Le récit tient sans dates — un constat, un
    parti pris, une liste de refus.
  - **Chaque valeur est adossée à une fonctionnalité réelle**, et la carte
    l'affiche. Deux valeurs de l'ancienne version ont été retirées
    (« cercles de parole, méditations guidées et rituels », « ateliers de
    développement personnel ») : rien dans le code ni ailleurs sur le site
    ne dit que ces activités existent.
  - **Les statistiques restent branchées sur `/api/stats`**, mais la bande
    ne s'affiche que si au moins un compteur est non nul — avant le
    lancement, « 0 membre » sur la page qui raconte l'histoire dessert.
  - **`/equipe` n'invente personne** : pas de portrait, pas de prénom. La
    page l'explique au lieu de faire du teasing, et le type `Pole` est prêt
    à recevoir `nom` et `photo` le jour venu.

- [x] **Piège du motif d'éclipse, troisième occurrence** (27/09/2026) :
  `EclipseMark` peint avec `currentColor`. Posé dans un conteneur en crème,
  il ressortait **blanc** — un soleil délavé. Ailleurs il sert de décor de
  fond à très faible opacité (`text-orange/[0.08]`), ce qui masquait le
  problème. En usage au premier plan, **lui donner une couleur explicite**.

- [x] **Démenti majeur : la vérification n'est ni humaine ni longue**
  (27/09/2026). Le porteur du projet a corrigé une affirmation sur laquelle
  tout le discours du site reposait. Le code le confirmait déjà :
  `src/app/api/identity-verification/route.ts` appelle
  `stripe.identity.verificationSessions.create` avec
  `require_live_capture: true` et `require_matching_selfie: true`. **C'est
  Stripe Identity, automatisé, immédiat.** Le site annonçait partout « une
  équipe humaine » et « 24 à 48 h » : **65 occurrences dans 26 fichiers**,
  dont les trois pages écrites le matin même, où j'en avais fait l'argument
  central.
  - **Deuxième affirmation fausse trouvée au passage** : « chaque photo est
    contrôlée à la main ». La modération des photos passe par Cloudinary +
    AWS Rekognition (`src/lib/moderation.ts`), elle est **automatique** et
    **désactivée par défaut** — il faut l'add-on souscrit et
    `CLOUDINARY_MODERATION_ENABLED=true`. La promesse a été retirée, pas
    reformulée, sur décision du porteur du projet.
  - **Ce qui reste vrai** : la vérification est obligatoire avant tout accès,
    elle repose sur un document officiel comparé à un selfie pris en direct,
    elle est gratuite pour le membre, et **les signalements sont bien traités
    par un humain** (modèle `Report` + file d'attente admin). Le discours a
    été rebâti là-dessus.
  - **Formulation retenue**, à réutiliser : « Pièce d'identité et selfie en
    direct, vérifiés par Stripe Identity. Résultat immédiat. » Nommer Stripe
    est un choix assumé du porteur du projet : un tiers connu rend la
    promesse crédible sans qu'on ait à se croire sur parole.
  - **Le coût du parti pris a changé de nature** dans le récit de
    `/histoire` : ce n'est plus du temps humain, c'est une pièce d'identité à
    sortir (des visiteurs referment la page) et un coût par vérification, à
    la charge du site. Les deux sont vrais et restent défendables.

- [x] **Messages d'erreur au féminin dans les API** (27/09/2026) : le
  balayage de genre de septembre n'avait traité que les pages. **86
  occurrences** corrigées dans les routes et les modèles, dont « Utilisatrice
  introuvable. » (×13) et « Non authentifiée. » (×12) — des chaînes que
  l'utilisateur voit vraiment. « Action non autorisée » a été **laissé tel
  quel** : *action* est féminin, l'accord est correct.

- [x] **Quatre façades trouvées, trois corrigées** (27/09/2026). Après le
  formulaire de contact, un balayage a montré que le défaut était un motif,
  pas un accident :
  1. `/contact` — envoi simulé. **Corrigé** : route `/api/contact` créée.
  2. `/confidentialite` — **le même formulaire simulé**, et surtout ce
     n'était pas une politique de confidentialité : titre « On est là pour
     vous 💜 », contenu = un doublon de la page contact. Or cette URL est
     liée depuis le pied de page, les trois autres pages légales, le
     sitemap, et **la case de consentement de l'inscription**. Le site
     faisait accepter une politique qui n'existait nulle part. **Corrigé** :
     vraie politique rédigée.
  3. `/vibesphere/journal` — « Analyse IA en cours… » pendant 1,2 seconde
     artificielle, puis une phrase tirée d'une table de six réponses indexée
     sur l'humeur **cochée par la personne** ; le texte écrit n'était jamais
     lu. **Corrigé** : plus d'attente factice, plus de mention d'IA, la
     fonction s'appelle `motPourHumeur` et un commentaire dit ce qu'elle est.
  4. **Le bandeau cookies ne commandait rien.** `<Analytics />` de Vercel
     était monté sans condition dans `layout.tsx`, et les préférences de
     consentement n'étaient lues **nulle part dans l'application** — seuls
     les tests unitaires les consultaient. Refuser la mesure d'audience
     enregistrait un refus sans effet. **Corrigé** : composant
     `AnalytiqueConsentie` qui ne monte `<Analytics />` qu'après acceptation
     explicite, et un événement `sferasolys:consentement-cookies` diffusé par
     le hook pour que la coupure soit immédiate et non au rechargement
     suivant (deux instances du hook ont deux états séparés — sans ce signal,
     rien ne se propage).
  - **Leçon de méthode** : mon détecteur automatique de « formulaire sans
    appel réseau » ne remonte rien, pas même `/confidentialite` que je
    connaissais. Les quatre façades ont été trouvées à la main, en cherchant
    `simulation|à remplacer|setTimeout`. Ne pas se fier au détecteur.

- [x] **Politique de confidentialité rédigée** (27/09/2026) : chaque fait
  provient du code — champs de `src/models/*.ts`, sous-traitants réellement
  appelés, cookies de `useCookieConsent.ts`. Les informations qui ne s'en
  déduisent pas (identité juridique, adresse, **durées de conservation**,
  DPO) apparaissent en **[À COMPLÉTER]** visible à l'écran, sous un encart
  d'avertissement. ⚠️ **À faire relire par un juriste avant mise en ligne.**

- [x] **Coquille commune aux pages légales** : `src/components/legal/PageLegale.tsx`
  (176 l.) porte en-tête, accordéon et renvois. Les trois autres pages
  légales (conditions, cookies, accessibilité) restent à y brancher — leur
  texte juridique vit déjà dans des tableaux de données, à reprendre **tel
  quel** pour qu'aucune migration visuelle ne touche la lettre.
  - Aucune des quatre pages légales n'avait de `layout.tsx`, donc **aucune
    n'avait de titre ni de description** : composants client, `metadata`
    impossible. Celui de `/confidentialite` est créé ; trois restent.

- [x] **Disque plein sur la machine** (27/09/2026) : une écriture a échoué
  avec « No space left on device » — 120 Mo libres sur 461 Go. `.next`
  (622 Mo) a été supprimé après accord, ce qui a rendu 762 Mo. ⚠️ Le volume
  reste à 100 % : c'est un problème de la machine, pas du projet. À savoir :
  `open(…, 'w')` tronque **avant** d'écrire — une écriture Python qui échoue
  pour cette raison peut vider un fichier. Vérifier immédiatement après.

- [x] **Trois dernières pages légales migrées** (27/09/2026) : conditions
  (320 → 178 l.), cookies (457 → 121 l.), accessibilité (287 → 103 l.),
  toutes branchées sur `PageLegale`. Les quatre pages légales ont désormais
  leur `layout.tsx` et donc un titre et une description.
  - **Le texte juridique n'a pas été retapé.** Il a été extrait des fichiers
    sources par script (comptage de crochets, pas de regex approximative),
    seules les clés de structure ont été renommées, et la fidélité a été
    **vérifiée automatiquement** : comparaison de la prose avant/après, et
    comparaison une à une des chaînes de contenu. Identiques. C'est la seule
    méthode acceptable pour déplacer un document qui engage.
  - Doublon supprimé sur la page cookies : elle écrivait son contenu deux
    fois, une version bureau en JSX à la main et une version mobile bâtie
    depuis `policySections`. Seuls les tableaux sont conservés.
  - Le vouvoiement est **conservé dans le texte juridique** — c'est l'usage
    pour des CGU — alors que le reste du site tutoie. À trancher si tu veux
    l'uniformiser : c'est un choix de style, pas une contrainte légale.
  - ⚠️ Les CGU portent maintenant la date de leur dernière modification
    réelle (27/09/2026) et non plus « juin 2025 », héritée du projet
    d'origine alors que le texte avait changé depuis (âge 18 → 28).

- [x] **Pièges rencontrés dans ma propre outillage** (27/09/2026), à
  connaître avant de refaire ce genre de transplantation :
  - le générateur ajoutait un `id` dérivé du titre **même aux objets qui en
    avaient déjà un** (`policySections`), produisant deux clés identiques
    dans le même littéral — TS1117. Toujours vérifier l'existant avant
    d'ajouter une clé ;
  - le script de régénération **relisait les fichiers qu'il venait
    d'écraser** : rejoué une seconde fois, il ne trouvait plus les tableaux
    d'origine et échouait. Un script de migration doit lire une source
    immuable, pas sa propre sortie ;
  - le texte extrait contenait des composants (`Link`) dont l'import
    n'existait pas dans le nouveau fichier. Contrôler les identifiants
    majuscules utilisés mais non importés après toute transplantation.

### ⚠️ Deux changements à faire valider

1. **Conditions générales** (`/conditions`) : le texte disait « plateforme de rencontre destinée aux **femmes** âgées de **18** ans et plus ». C'est devenu « aux **hommes** âgés de **28** ans et plus », pour coller au critère produit documenté. Le passage de 18 à 28 est une modification de fond d'un texte contractuel — à relire, voire à faire relire.
2. **Clé de consentement cookies** : `useCookieConsent.ts` stockait sous `sferaluna-cookie-consent`, désormais `sferasolys-cookie-consent`. Conséquence : tout visiteur ayant déjà donné son consentement sera re-sollicité. Sans impact aujourd'hui (le site n'est pas en ligne), mais à savoir. Le test correspondant a été aligné.

### 🔬 Vérification : `tsc` est disponible sur le Mac — s'en servir

Découvert le 25/09 : le projet a `node`, `tsc` et `node_modules` installés, donc **`node ./node_modules/typescript/bin/tsc --noEmit` tourne et donne une vraie vérification de types**. (L'`esbuild` de `node_modules` est un binaire macOS, inutilisable depuis le VM Linux de l'assistant — passer par `tsc`, qui est du JS pur.)

Ça a payé immédiatement : le remplacement automatisé de la marque avait **cassé une chaîne** dans `/histoire`. Une regex de chaînes en quotes simples avait mordu sur les apostrophes internes d'une chaîne en guillemets doubles (`"Tout part d'un constat … qu'on peut"`), transformant `d'un` en `d"un`. Invisible au grep, fatal à la compilation. Leçon : après tout remplacement automatisé de texte français, lancer `tsc` **et** chercher le motif « lettre-guillemet-lettre ».

**Le pont de fichiers vers le Mac peut mentir** (27/09/2026) : un envoi a répondu
« écrit » en reposant en réalité la version précédente du fichier. Le rendu de
contrôle était donc juste, et le fichier sur le disque faux — écart très coûteux à
diagnostiquer. **Vérifier chaque envoi par empreinte** (`md5sum` des deux côtés),
jamais sur la réponse de l'outil. Un envoi sous un nom de fichier neuf contourne le
problème.

**À savoir :** `next.config.ts` contient `typescript: { ignoreBuildErrors: true }` et `eslint: { ignoreDuringBuilds: true }`. Le build passe donc malgré les erreurs de types — c'est pourquoi **26 erreurs préexistantes** se sont accumulées sans bruit : `models/User.ts` (13, typage mongoose), `mon-compte` (5) et `valeurs` (2) (typage `Variants` de framer-motion), `models/Subscription.ts` (2, exports manquants), `ui/Button.tsx` (1), et 3 dans les types générés de Next. Aucune n'a été introduite par ce chantier, et elles méritent leur propre passe.

### 🧹 Retrait de VibeSphere, du journal et du VibePlanner (27/09/2026)

Trois fonctionnalités ont été **retirées du produit**, pas masquées : la
VibeSphere (fil communautaire parallèle à `/communaute`), le journal émotionnel
et le VibePlanner. Motif : la VibeSphere doublait la Communauté Solys, le
journal reposait sur une fausse « analyse IA » (un `setTimeout` de 1,2 s suivi
d'un mot tiré d'une table), et le VibePlanner était vendu dans les offres sans
exister ailleurs que dans un compteur de quota.

**VibeMentor est conservé** : c'est une contrepartie réelle de l'offre Elite
(`vibementorCoaching`), et son modèle `MentorPost` est alimenté.

Supprimés : `src/app/vibesphere/`, `src/app/vibeplanner/`,
`src/app/api/vibesphere/`, `src/app/api/vibeplanner/`, `src/app/api/journal/`,
`src/models/VibePost.ts`, `src/models/VibePlan.ts`, `src/models/JournalEntry.ts`.

Le retrait ne s'arrête pas aux fichiers : une fonctionnalité supprimée laisse
des traces dans les **quotas** (12 drapeaux dans `lib/subscription/config.ts`,
l'action `"vibeplanner"` dans `api/subscription/check`), les **suppressions en
cascade** (`api/admin/reset`, `api/admin/users/[id]`, `api/users/me`), la
**navigation** (Header, Footer, Sidebar), le **sitemap**, et surtout la **copy
commerciale** — `/tarifs`, `/fonctionnalites` (« 8 fonctionnalités » → 6),
`/guide`, `/faq`, `/paiement`, la page d'accueil. C'est cette dernière couche
qui pourrit le plus longtemps : un tarif qui promet une fonctionnalité absente
se lit comme un mensonge, pas comme une dette technique.

Effet de bord utile : `api/reports` prétendait attendre « ton modèle VibePost »
pour vérifier les signalements de posts communautaires, et acceptait donc
**n'importe quel ObjectId valide**. Le modèle `CommunityPost` existait depuis le
début. La cible est maintenant vérifiée comme les deux autres (existence +
interdiction de s'auto-signaler).

Contrôle : `tsc` revient à **23 erreurs préexistantes, zéro liée aux Vibe\***,
et `grep -rni "vibesphere\|vibeplanner\|vibepost\|journalentry"` ne renvoie rien.

### 🚀 Les boosts implémentés pour de vrai (27/09/2026)

Cinquième façade du site, et la plus chère : les boosts étaient **vendus** (1,
3 ou 10 par mois selon l'offre, `boostsPerMonth` dans
`lib/subscription/config.ts`), le modèle `Boost` existait avec ses index, le
compteur de quota fonctionnait — et `Boost` n'apparaissait dans tout le code
qu'à **deux endroits** : un `countDocuments` pour le quota, un `deleteMany` à
la suppression de compte. Aucune route ne créait jamais de boost. Aucun
classement n'en lisait un. Un membre Elite payait 34,99 € par mois pour dix
mises en avant sans effet observable.

Le tri d'Explorer (`/api/profiles`) était `updatedAt` décroissant, point. C'est
le seul endroit du site qui décide de l'ordre d'apparition des profils, donc le
seul endroit où un boost peut exister.

**Ce qui a été construit**

- `src/lib/boosts.ts` — durée (30 min), force (×2), fenêtre d'activité,
  classement, et le pipeline d'agrégation. Tout est ici pour que l'API et
  l'interface ne puissent pas en donner deux versions.
- `POST /api/boosts` — le premier endroit du projet où un boost naît. Quota via
  `canPerformAction("use_boost")`, refus si un boost tourne déjà, refus si le
  profil est incomplet ou invisible (un boost sur un profil absent d'Explorer
  serait consommé pour rien).
- `GET /api/boosts` — boost en cours et quota du mois.
- `src/components/boost/PanneauBoost.tsx` — lancement, décompte, quota restant.
  Monté en tête d'Explorer.
- Classement dans `/api/profiles` : `scoreBoost` calculé par agrégation, trié
  avant `updatedAt`.

**La règle qui compte** : un boost est actif *si et seulement si*
`startsAt <= maintenant < endsAt`. La date est l'autorité, pas le champ
`status`. Si aucune tâche planifiée ne passe jamais faire le ménage, un boost
échu reste marqué `active` en base mais **ne classe plus rien**. Un avantage
payant ne doit jamais dépendre d'un cron qui pourrait ne pas tourner.

**Deux chemins de lecture assumés** dans `/api/profiles` : sans boost en cours
(le cas courant), on garde le `find().sort()` indexé d'origine — coût
inchangé ; avec au moins un boost, une agrégation trie sur un champ calculé,
donc en mémoire. On ne paie l'agrégation que quand elle sert. Les deux chemins
renvoient exactement les mêmes champs, `miseEnAvant` compris.

**Choix produit** : un profil poussé le dit. `miseEnAvant` est exposé par l'API
et la carte affiche « Mis en avant » pendant toute la durée du boost. Les
boosts d'un même membre ne se cumulent pas — sinon enchaîner dix boosts
reviendrait à acheter la première place.

**La copy a dû suivre.** `/valeurs` et `/histoire` affirmaient « un abonnement
ouvre des fonctionnalités, jamais une place devant les autres dans la file », et
`/histoire` rangeait « la visibilité qui s'achète » parmi les refus. Rendre les
boosts réels rendait ces phrases fausses : elles disent maintenant ce qui est
vrai — la visibilité s'achète, plafonnée, limitée à trente minutes, et signalée.
`/tarifs` liste enfin les boosts qu'il vendait sans les nommer, et
`/fonctionnalites` passe à 7 fonctionnalités avec une carte dédiée.

**Vérification** : 22 tests. Le pipeline a été exécuté contre un vrai `mongod`
(mongodb-memory-server, dans le conteneur de session, hors dépôt) : profil
boosté remonté en tête même s'il est le moins récemment actif, boostés triés
entre eux par score, **pagination correcte à travers la frontière des boostés**,
et aucune fuite de `scoreBoost` dans la projection. Les tests embarqués dans le
dépôt (`src/__tests__/boosts.test.ts`) couvrent la logique et la forme du
pipeline sans dépendance lourde.

### ⚠️ Façade trouvée en chemin : les quotas quotidiens n'existent pas

`subscription-check.ts` compte les likes et messages du jour via
`user.dailyLikesCount` / `dailyLikesDate` / `dailyMessagesCount` /
`dailySuperLikesCount`. **Ces champs n'existent pas dans `models/User.ts` et ne
sont incrémentés nulle part.** Les compteurs renvoient donc toujours zéro,
`canPerformAction("like")` autorise toujours, et les « 5 likes par jour » ou
« 10 messages/jour » annoncés sur `/tarifs` **ne sont pas appliqués**. C'est le
même mensonge commercial que les boosts, dans l'autre sens : on vend
l'illimité comme un avantage sur une limite qui n'existe pas.

En attendant, `/api/subscription/status` renvoie `null` pour
`remainingSwipes` et `remainingMessages` — un trou visible plutôt qu'un chiffre
inventé — et calcule pour de vrai `remainingBoosts` et
`remainingProfileVisits`, les deux seuls adossés à une collection.

À traiter avec le chantier `/explorer` + `/messages`.

**Note** : `src/middleware/check-limits.ts` (938 lignes) est un doublon de
`src/lib/subscription/subscription-check.ts` (1 027 lignes) que **personne
n'importe**. Les deux définissent une classe `SubscriptionChecker`. Seul celui
de `lib/` est utilisé. À supprimer.

### 📖 Explorer devient un annuaire (28/09/2026)

Explorer était un swipe façon Tinder : trois cartes empilées,
glisser-à-droite pour liker, glisser-à-gauche pour passer, et un préchargement
qui rallongeait la liste sans fin. Or le site affirme deux fois le contraire.
`/valeurs` : « Le Circle of Six propose six profils le lundi, puis s'arrête. À
côté, l'annuaire permet de chercher par soi-même. Aucune des deux vues ne
défile à l'infini : ce n'est pas un oubli, c'est le produit. » Et
`/fonctionnalites` vend « des liens choisis, pas des milliers de swipes » et
« moins de fatigue du swipe ».

**L'annuaire promis n'existait pas** : Explorer *était* le swipe. Décision de
l'utilisateur : transformer la page, pas la copy.

Ce qui remplace la pile : une grille paginée, une recherche, et une
**pagination explicite** — on demande la page suivante, elle ne vient pas toute
seule. C'est le cœur du changement ; la grille et les filtres n'en sont que la
conséquence.

**Ce qui disparaît, et pourquoi**

- Le glisser-pour-liker : un geste rapide et réversible-par-accident est
  exactement ce que la page prétendait refuser.
- Le bouton « passer » : dans un annuaire on ne passe pas, on ne like pas.
  Rien à enregistrer.
- Le compteur « x profils à découvrir », qui comptait ce qui restait dans la
  pile chargée et non les membres. L'annuaire affiche le total réel de l'API.
- **La visite enregistrée passivement.** L'ancienne page envoyait un
  `POST /api/visitors` pour *chaque carte affichée*. En grille, ça ferait vingt
  visites par page feuilletée : « qui a vu ton profil » deviendrait du bruit, et
  le quota de visites (20 sur l'offre gratuite) serait épuisé en une page. La
  visite part maintenant au clic sur « voir le profil ».

**Trois défauts de fond corrigés au passage**

- Les filtres d'âge partaient de **18 ans** alors que la plateforme est
  réservée aux 28 ans et plus ; l'API corrigeait silencieusement à 28.
- Les orientations proposées étaient **toutes au féminin** (« Hétérosexuelle »,
  « Lesbienne / Homosexuelle », « Curieuse ») — reste du fork.
- « Toute la France » envoyait un département vide, ce que l'API interprète
  comme « respecte la portée enregistrée par le membre ». Un membre réglé sur
  « mon département » restait donc dans son bassin **en ayant demandé le
  contraire**. L'API attend `all` ; le select a maintenant trois états
  distincts, dont « Selon ma préférence » par défaut.

**Effet de bord supprimé** : l'ancienne page avait trois effets de chargement
qui s'alimentaient l'un l'autre, dont un qui incrémentait `page` à l'infini
quand l'API échouait (commentaire d'origine : « ex: page=271, 272, 273… »). Il
n'en reste qu'un, déclenché par la page et les filtres appliqués.

**Contraste vérifié par calcul**, pas à l'œil. Quatre choix ont été corrigés
après mesure : `cream/35` en placeholder (2,90:1), `cream/40` en texte d'aide
(3,34:1), `cream/50` dans le panneau de boost (4,47:1), et la puce d'intention
sélectionnée en `text-orange` sur `bg-orange/15` (4,16:1) — remplacée par de
l'orange plein avec du texte abyss (5,23:1), qui se lit aussi mieux comme état
« choisi ». Rappels mesurés : cream sur orange plein = 3,00:1 et cream sur lime
plein = **1,04:1**, donc invisible. L'orange et le lime ne portent que du texte
abyss.

### 🔒 Les quotas quotidiens appliqués (28/09/2026)

Suite de la façade signalée la veille. `src/lib/quotas.ts` compte désormais les
likes et les messages du jour **sur les collections** `Like` et `Message`,
plutôt que sur les champs `dailyLikesCount` / `dailyMessagesCount` qui
n'existent pas dans `models/User.ts`. `POST /api/likes` refuse au-delà du
quota — l'offre gratuite donne 5 likes par jour, ce qui n'était vérifié nulle
part — et renvoie le quota dans sa réponse pour que l'interface l'affiche sans
second appel.

**Pourquoi compter plutôt qu'incrémenter** : un compteur dénormalisé sur `User`
demande une migration, une remise à zéro quotidienne fiable, et il dérive au
premier écrit manqué. Compter la collection est exact par construction, et
indexé (`Like` porte déjà `{ fromUserId: 1, createdAt: -1 }`).

**Deux pièges traités** : un « re-like » ne consomme rien, parce que la création
est un upsert — on teste l'existence avant le quota, sinon un membre gratuit
serait bloqué en rappuyant sur un profil déjà liké. Et le quota ne passe pas par
`canPerformAction`, qui refuse d'emblée tout membre sans abonnement actif : ça
bloquerait les 5 likes de l'offre gratuite au lieu de les accorder. Le plan
effectif exige un abonnement `active`/`trialing` — un abonnement résilié dont
`user.plan` est resté à « premium » retombe sur les limites gratuites.

**Super likes** : toujours non mesurables, et c'est documenté dans le code —
aucun modèle ne les stocke (`SuperLike.ts` n'existe pas, `Like.ts` ne distingue
pas les deux) et l'interface ne les propose nulle part.

`/api/subscription/status` renvoie maintenant les quatre usages mesurés
(`likesDuJour`, `messagesDuJour`, `boostsDuMois`, `visitesDeProfil`) ; `null` y
signifie « illimité », pas « zéro restant ».

**Reste à faire sur ce sujet** : `POST /api/messages/[matchId]` n'applique
toujours pas la limite de 10 messages/jour de l'offre gratuite, ni
`maxMatches: 3`. Le compteur existe désormais (`quotaMessagesDuJour`) ; il faut
l'appeler. À traiter avec le chantier `/messages`.

### 🧹 Dette de types réduite : 23 → 21

Trois routes déclaraient `return access.response` alors que `response` est typé
`NextResponse | null` : renvoyer `null` depuis un handler de route ferait tomber
Next à l'exécution. Corrigé dans `/api/visitors` et `/api/subscription/check`
(6 occurrences) avec une réponse de repli. Et
`/api/messages/[matchId]` typait `params` en
`{ matchId: string } | Promise<{ matchId: string }>`, union que le validateur de
routes de Next 15 rejette : `params` est toujours une promesse.

Les erreurs restantes (21) sont toutes dans `models/User.ts` (13, typage
mongoose), `mon-compte` (5), `models/Subscription.ts` (2, exports manquants) et
`ui/Button.tsx` (1).

### 👤 Page de profil migrée, et un trou de confidentialité refermé (28/09/2026)

`/profil/[id]` rejoint le groupe `(app)` (donc la sidebar, plus de
Header/Footer propres) et passe à l'éclipse solaire. Mais l'essentiel n'est pas
visuel.

**Le bouton « Liker ce profil » appelait `router.back()`.** Rien d'autre. Le
commentaire d'origine l'assumait : « Pour l'instant, je garde ta logique :
retour à la page précédente. Plus tard, si tu veux, on pourra le connecter
directement à /api/likes. » Un bouton qui annonce une action et navigue à la
place est pire qu'un bouton absent : il consomme une intention. Il like
maintenant pour de vrai, avec le quota du jour et la détection de réciprocité,
et affiche trois états distincts — à aimer, déjà aimé, déjà en relation.

**La visibilité « réservé à mes matchs » ne protégeait rien.**
`/api/profiles/[id]` portait un commentaire expliquant qu'il fallait attendre le
modèle `Match`… qui existait depuis le début. Résultat : un membre ayant choisi
ce réglage était bien exclu de l'annuaire (`/api/profiles` filtre sur
`visibilite`), mais son profil restait **entièrement consultable par n'importe
quel membre connecté** ayant son identifiant. Un réglage de confidentialité qui
protège de la navigation mais pas de l'accès direct ne protège de rien. La route
vérifie désormais qu'un match actif lie les deux comptes.

L'API renvoie aussi un bloc `relation` (`estMonProfil`, `dejaAime`,
`estUnMatch`, `matchId`) : c'est lui qui permet au bouton d'être juste, au lieu
de deviner.

**La visite se compte sur la page de profil, plus dans l'annuaire.** Une visite
a lieu quel que soit le chemin d'arrivée — messages, matchs, Circle, lien
direct — et l'annuaire était le seul à l'enregistrer. Le serveur ignore déjà les
auto-visites et dédoublonne par jour (`visitDay`), donc centraliser ne gonfle
rien.

**Restes du fork trouvés sur cette page** : les orientations étaient au féminin
(« Hétérosexuelle », « Lesbienne / Homosexuelle », « Curieuse »), le badge
disait « Vérifiée », la lune 🌙 servait d'icône aux centres d'intérêt, la page
vouvoyait alors que tout le reste tutoie — et **l'initiale de secours de
l'avatar était « L »**, pour Luna. L'ancienne valeur `curieuse` reste mappée,
pour les profils enregistrés avant la reprise.

### 🎨 Règle de contraste : l'orange ne porte plus de petit texte

Les instructions du projet disaient déjà « réserver l'orange aux accents et gros
éléments, pas au petit texte ». La refonte l'avait pourtant enfreint partout :
le motif `bg-orange/[0.12] … text-orange` servait de pastille « eyebrow » sur
**douze pages** plus `PageLegale`, en plus des états sélectionnés de la sidebar,
de la FAQ et de `DossierParcours`.

Mesures (texte orange sur fond orange tinté, au-dessus de la carte `#0C222D`) :

| tinte | ratio sur carte | ratio sur abyss |
|---|---|---|
| orange/6  | 4,51 | 5,04 |
| orange/8  | 4,47 | 5,01 |
| orange/10 | 4,38 | 4,92 |
| orange/12 | **4,29** | 4,83 |
| orange/15 | **4,16** | 4,70 |

Sur `abyss` ça passe ; **sur la carte, non** — et c'est là que vivaient les
pastilles. Le texte passe donc en `cream` (12,9 à 14,5:1) et l'orange reste sur
la bordure : la pastille se lit toujours comme un accent orange. Les marqueurs
qui doivent sauter aux yeux (`[À COMPLÉTER]`, « En relation », « Mis en avant »)
passent en orange plein avec du texte `abyss` (5,23:1).

Exception conservée : un conteneur d'icône en `bg-orange/15 text-orange`
(`inscription/steps/Step5`) reste valide — un pictogramme demande 3:1, pas 4,5.

**Le lime n'a pas ce problème** : sur ses propres tintes il donne 7,8 à 12,6:1.
Le piège du lime est l'inverse, et il est documenté plus haut : **cream sur lime
plein = 1,04:1**, donc invisible. Le lime ne porte que du texte `abyss`.

### 💞 /matches migrée, plafond appliqué, et une sortie enfin possible (28/09/2026)

Trois trous sur cette page, dont un que la migration a rendu bloquant.

**1. On ne pouvait pas quitter une relation.** `DELETE /api/likes` existe depuis
le début — il retire le like et désactive le match — et **aucune page du site ne
l'appelait**. Pire : trois routes complètes n'ont jamais eu d'interface,
`DELETE /api/matches/[id]` (suppression douce via `deletedBy`),
`PATCH /api/matches/[id]/archive` et `PATCH /api/matches/[id]/mute`. Les champs
`archivedBy`, `mutedBy` et `deletedBy` du modèle ne sont lus nulle part. Un
membre entrait dans une relation et n'en sortait jamais.

`/matches` a maintenant « Mettre fin », en deux temps dans la carte (pas de
boîte de dialogue native). L'archivage et la sourdine attendent `/messages`,
c'est leur place.

**2. Le plafond de l'offre gratuite n'était appliqué nulle part.** `/tarifs`
annonce « 3 matchs maximum » et `maxMatches` vaut 3 dans la config, mais aucune
ligne ne lisait cette valeur. Choix de l'utilisateur : **bloquer la formation du
4ᵉ match**, pas le like.

Donc `src/lib/matches.ts` : quand un like réciproque ferait dépasser le plafond
de l'un des deux, le like **reste enregistré** et la relation est « en
attente ». Elle s'ouvre dès qu'une place se libère — `DELETE /api/likes` appelle
`ouvrirEnAttente`, qui promeut les paires réciproques dans l'ordre d'arrivée du
like reçu, premier arrivé premier servi.

Quatre points de conception qui méritent d'être écrits :

- **Chacun contre son propre plafond.** On n'applique pas le plus strict des
  deux aux deux : un membre payant n'est jamais limité par l'offre de son
  vis-à-vis. Il reste qu'une relation demande deux places, donc si l'un est au
  plafond, elle attend. Pour ça, `/api/likes` doit charger
  `plan/isPremium/subscriptionStatus` **de la cible** — sans ça, un membre
  payant serait mesuré contre l'offre gratuite par défaut et bloquerait tout.
- **Pas de résurrection involontaire.** « En attente » = les deux likes existent
  et aucun match actif ne les relie. Retirer un like le supprime, donc une
  relation à laquelle on a mis fin ne revient pas : la paire n'existe plus.
- **Les deux sorties libèrent une place.** Le comptage exclut les matchs que le
  membre a lui-même mis dans `deletedBy`, même s'ils restent actifs pour
  l'autre. Sans ça, « retirer de ma liste » laisserait la place occupée et le
  plafond deviendrait un cul-de-sac.
- **Le message ne révèle pas l'offre de l'autre.** Si c'est la cible qui est au
  plafond, on dit seulement qu'elle n'a pas de place.

**3. Les messages non lus étaient calculés puis jetés.** `/api/matches` agrège
`unreadCount` par conversation depuis toujours ; le type `MatchItem` de
l'ancienne page ne le déclarait même pas. Le compteur est affiché.

**Structure** : l'ancienne page maintenait **deux arbres de cartes** — un
accordéon mobile et des cartes complètes à partir de `md` — soit la même
information écrite deux fois. Une seule carte responsive les remplace. La page
rejoint le groupe `(app)`.

### ⏳ La vérification d'identité : barrière à poser, décision prise

`identityVerified` **n'est utilisé comme barrière nulle part dans le code**.
Le site promet pourtant, sur `/histoire` : « Aucun accès au produit avant qu'un
document officiel ait été vérifié. Sans exception, et sans possibilité de passer
devant. » En pratique, un compte non vérifié a accès à tout.

Décision de l'utilisateur : **brancher plus tard, avec les clés Stripe**. La
raison est concrète — `STRIPE_SECRET_KEY` est encore `A_REMPLACER`, donc
personne ne *peut* être vérifié : poser la barrière maintenant fermerait le
site à son propre auteur, y compris pour tester.

Ce qu'il faudra faire le jour où Stripe est configuré :

- une barrière côté serveur, pas seulement une redirection côté client : les
  routes qui ouvrent le produit (`/api/profiles`, `/api/likes`, `/api/messages`,
  `/api/matches`, `/api/circle`) doivent refuser un compte non vérifié ;
- `src/middleware.ts` ne couvre que `/api/:path*` — c'est le bon endroit pour
  une vérification transverse, à condition de lire la session ;
- prévoir l'état « vérification en cours » (Stripe Identity est rapide mais pas
  instantané) et un écran d'attente qui ne ressemble pas à un refus ;
- décider ce qu'un compte non vérifié peut voir : rien, ou son propre profil et
  la page de vérification. La seconde option est la seule utilisable.

### État de test (28/09/2026)

`.env.local` : `MONGODB_URI` et `NEXTAUTH_*` renseignés, **tout le reste est
`A_REMPLACER`**. Conséquences pour tester :

- **Marche** : inscription e-mail + mot de passe, connexion immédiate (la
  vérification d'e-mail n'est pas bloquante — l'envoi part en `.catch()`),
  profil, annuaire, likes et leur quota, matchs, messages (enregistrés), page de
  profil.
- **Ne marche pas** : Google/Apple (clés vides), Stripe (donc ni abonnement ni
  vérification d'identité), Cloudinary (aucun upload de photo), Pusher (les
  messages arrivent mais pas en temps réel — les échecs sont attrapés, donc rien
  ne casse), Resend (aucun e-mail).
- Il faut **deux comptes** pour tester un match et une conversation, et forcer
  `plan` / `isPremium` / `subscriptionStatus` dans Atlas pour voir le panneau de
  boost autrement qu'en « ton offre ne comprend pas de boost ».

### 💬 /messages migrée : deux réglages sortis du placard, et le quota appliqué (28/09/2026)

**La sourdine et le rangement n'existaient que côté serveur.**
`PATCH /api/matches/[id]/mute` et `PATCH /api/matches/[id]/archive` étaient
complets, testables au curl, et **aucune interface ne les appelait**. Pire :
`mutedBy` et `archivedBy` n'étaient relus nulle part, donc même appelés à la
main ils n'auraient rien changé — deux réglages purement décoratifs.

Les deux ont maintenant un bouton *et* un effet :

- la **sourdine** coupe la notification push du destinataire dans
  `POST /api/messages/[matchId]`, jamais l'arrivée du message ni l'événement
  Pusher. Une conversation muette reste une conversation. Une sourdine expirée
  ne compte pas : la date tranche, comme pour les boosts ;
- le **rangement** sort la relation de la liste principale de `/matches`, avec
  un basculement « En cours / Rangées ». Une relation rangée **occupe toujours
  une place** dans le plafond : ranger est un classement, pas une sortie. C'est
  dit à l'écran, pour que personne ne range en croyant libérer une place.

**La limite de 10 messages par jour n'était pas appliquée.** `/tarifs` l'annonce
depuis le début ; le compteur lisait `dailyMessagesCount`, champ absent du
modèle `User`. `POST /api/messages/[matchId]` refuse maintenant au-delà du
quota, et renvoie ce qui reste — la zone de saisie l'affiche, parce qu'il vaut
mieux le savoir avant d'écrire qu'après.

Détail qui compte : le quota est vérifié **après** la modération
anti-harcèlement. Un message bloqué pour abus n'a jamais existé, il ne doit pas
consommer de quota.

**Le temps réel peut manquer, et il faut le dire.** Les clés Pusher sont
optionnelles : si l'abonnement échoue, la conversation reste utilisable mais ne
se met plus à jour seule. La page l'annonce au lieu de laisser croire à un
blocage.

Deux détails de contraste mesurés : l'horodatage dans une bulle orange était en
`abyss/70` (3,80:1) — passé en `abyss/90` (4,93:1) ; les accusés de lecture
héritent du même conteneur, donc corrigés avec.

**Détour assumé** : la page lit `/api/matches` en entier pour retrouver son
interlocuteur et ses réglages, parce que c'est la seule route qui expose
`archivee` et `sourdineActive`. Une route `/api/matches/[id]` en lecture ferait
mieux le jour où le volume le justifie.

### ⚠️ Incohérence connue, laissée en place

`DELETE /api/matches/[id]` (suppression douce via `deletedBy`) n'a toujours pas
d'interface — seul « Mettre fin » existe, qui passe par `DELETE /api/likes`.
Tant que c'est le cas, rien à faire. Mais le jour où la suppression douce est
exposée : `authorizeMatchAccess` dans `/api/messages/[matchId]` n'exige que
`isActive: true`, donc un membre qui a quitté la conversation pourrait continuer
d'y écrire. Il faudra refuser l'envoi quand l'expéditeur figure dans
`deletedBy`.

### ⭕ Circle of Six : la fonctionnalité signature n'était pas hebdomadaire (28/09/2026)

C'est la promesse centrale du produit, celle qui justifie qu'Explorer ne soit
pas un fil infini. `/valeurs` : « Le Circle of Six propose six profils le lundi,
puis s'arrête. » `/fonctionnalites` : « Chaque semaine, notre algorithme te
présente 6 profils. »

**Rien n'était hebdomadaire.** `/api/circle` recalculait le score à chaque appel
et renvoyait le top 6 du moment. Un like, la connexion d'un candidat, une
modification de profil, et les six changeaient — parfois entre deux chargements
de la même page. Le champ `weekOf` partait au client, s'affichait en « Semaine
du … », et ne figeait strictement rien. Et la page offrait un bouton
**« Actualiser »** qui relançait le tirage : l'exact contraire de « puis
s'arrête ».

Ce n'était pas une sélection hebdomadaire, c'était un classement permanent
affiché six par six.

**Figer demande de stocker.** Un tirage déterministe à partir de (membre,
semaine) ne suffit pas : le vivier change quand des membres s'inscrivent ou se
retirent, donc le top 6 bougerait quand même. D'où `models/CircleWeek.ts` — une
ligne par membre et par semaine, écrite au premier affichage, servie ensuite
jusqu'au lundi suivant.

L'index unique `{ userId, weekStart }` est la garantie qui compte : deux onglets
ouverts le lundi matin ne peuvent pas produire deux tirages différents. La route
s'appuie dessus (`upsert` + `$setOnInsert`) plutôt que sur un verrou applicatif.

**Deux trous d'accès, aussi.** La route ne lisait jamais le drapeau
`circleOfSix` — `false` sur l'offre gratuite, et `/tarifs` vend « Circle of Six
hebdomadaire » à partir d'Essentiel : n'importe quel compte connecté obtenait
ses six profils. Et `isPremium === true` était lu seul, sans
`subscriptionStatus`, donc un abonnement résilié continuait d'ouvrir les profils
réservés. Les deux passent maintenant par `planEffectif`.

**Le vivier était mal tiré.** `.limit(200)` sans tri prenait les 200 premiers
dans l'ordre naturel de la collection, c'est-à-dire en pratique les 200 plus
anciens comptes, indéfiniment les mêmes. Le plafond reste (300) mais porte
désormais sur les profils les plus récemment actifs.

**Les cas limites sont dits, pas masqués.** Moins de six profils arrive pour
deux raisons, et la page les distingue : le vivier était trop petit au moment du
tirage (six profils ne sortent pas d'un vivier de trois), ou un profil tiré est
devenu indisponible depuis. Dans le second cas il n'est **pas remplacé** — la
semaine est la semaine — et la page l'explique plutôt que d'afficher quatre
cartes sans un mot.

« Actualiser » est remplacé par ce qui manquait vraiment : le compte à rebours
jusqu'au prochain tirage, recalculé chaque minute.

### 👻 Mode Fantôme : la fonctionnalité était vraie, la publicité non (28/09/2026)

Bonne surprise pour une fois. Le Mode Fantôme **fonctionne** : passer en
`invisible` exige la feature `ghostMode` côté serveur (`/api/users/profile`), le
profil sort de l'annuaire et du Circle, et `/api/visitors` refuse d'enregistrer
la visite d'un membre invisible — la navigation ne laisse donc réellement aucune
trace.

Ce qui était faux, c'était ce qu'on en disait. **Cinq pages** promettaient des
« photos floutées » et un dévoilement « quand et à qui tu décides » :
`/fonctionnalites` (deux fois), `/guide`, `/faq` et l'accueil. Aucun floutage
n'existe nulle part dans le code, et aucun état de dévoilement par personne non
plus.

Décision de l'utilisateur : **corriger la copy**, pas construire la
fonctionnalité — les clés Cloudinary sont vides, donc un floutage n'aurait pas
été testable, et « tu décides à qui » suppose un état de dévoilement par
relation, c'est-à-dire une vraie fonctionnalité, pas un réglage.

**Deux autres affirmations sont tombées au passage.** `/guide` annonçait « notre
équipe de modération travaille 24h/24 […] surveille les interactions », et
`/faq` reprenait « l'équipe de modération surveille les interactions ». Il n'y a
pas d'équipe — `/equipe` le dit franchement — et rien ne surveille les échanges
en continu : il y a un filtre anti-harcèlement sur les messages, et des
signalements lus par une personne. C'est ce qui est écrit maintenant.

**Les quatre niveaux de visibilité sont enfin accessibles.** Le modèle porte
`public`, `matches`, `premium`, `invisible`, et l'API accepte les quatre. **La
page n'en proposait que deux** (public ↔ invisible) : « réservé à mes mises en
relation » et « réservé aux membres payants » n'étaient réglables nulle part.

C'était devenu gênant : depuis que `/api/profiles/[id]` applique réellement la
visibilité « mes matchs » (voir plus haut), on avait un réglage appliqué mais
impossible à choisir. La page les expose tous les quatre, et seul `invisible`
demande une offre Premium.

La page se termine par une section « ce que ces réglages ne font pas » — pas de
floutage, aucun effet sur les conversations, aucune dispense de vérification.
Une fonctionnalité qui dit ses limites se fait moins reprocher que celle qui les
laisse découvrir.

### 🔁 Le pont de fichiers a encore menti (28/09/2026)

Deuxième occurrence, un an de logs plus tard : `device_commit_files` a répondu
`"written"` en reposant **la version précédente** du fichier. Détecté par
l'empreinte, comme la première fois. Contourné en republiant sous un **nom de
fichier neuf**, ce qui a fonctionné du premier coup.

La règle tient donc toujours, et mérite d'être répétée : **vérifier chaque envoi
par `md5sum` des deux côtés**, jamais sur la réponse de l'outil. Sans cette
vérification, la page serait partie en production avec `method: "PATCH"` sur une
route qui n'expose que `PUT` — un bouton qui ne sauvegarde rien, c'est-à-dire
exactement le genre de façade que ce chantier passe son temps à retirer.

### 🗣️ Communauté Solys : le fil public était moins protégé que la messagerie privée (28/09/2026)

Le fil fonctionnait — publication, likes, commentaires, suppression par
l'auteur ou un admin. Mais il n'avait **aucune** des protections de la
messagerie privée, alors qu'il est plus exposé : un message privé atteint une
personne, un post atteint tout le monde.

Cinq manques côté API :

- **Aucun filtre de modération.** `moderateText` protégeait les messages privés
  et pas le fil public. Un contenu abusif y était publié directement, visible de
  tous, en attendant qu'un membre le signale. Le même filtre s'applique
  maintenant aux posts (titre + contenu) et aux commentaires, avec le même
  signalement automatique pour la modération.
- **Aucune limite de débit.** 5 publications et 20 commentaires par 10 minutes.
- **Aucune pagination.** `find(query)` sans `limit` renvoyait *tous* les posts
  jamais écrits, à chaque chargement. 20 par page, 50 au maximum.
- **Aucun contrôle de compte.** Un membre banni pouvait publier, commenter et
  liker, et les posts d'un compte banni restaient affichés. Les trois sont
  refusés, et le fil filtre les auteurs suspendus.
- **La catégorie n'était pas validée.** Une valeur hors enum faisait échouer
  mongoose et répondait 500 au lieu de 400.

Côté page :

- **Aucun signalement possible.** Le fil public était le seul endroit du site où
  un contenu abusif ne pouvait pas être signalé — alors que `Report` accepte le
  type `community_post` depuis le début, et le vérifie réellement depuis la
  correction de `/api/reports`. Le bouton existe.
- **Pagination explicite**, comme l'annuaire et pour la même raison.
- **Les emojis disparaissent de l'interface.** Le modèle exige un `emoji` par
  post et l'ancienne page ouvrait un sélecteur pour le choisir. La catégorie
  porte désormais une icône, et l'emoji stocké est déduit de la catégorie : un
  champ de moins à remplir, compatibilité conservée avec les posts déjà en base.

Le like est optimiste — l'état s'inverse immédiatement et se corrige si le
serveur refuse : c'est l'action la plus fréquente du fil, elle n'a pas à
attendre un aller-retour.

### 📅 Événements : `LunaEvent` renommé, et quatre contrôles posés (28/09/2026)

**La dernière trace structurelle de SferaLuna est partie.** Le modèle
s'appelait `LunaEvent` — nom du modèle, de l'interface, et surtout **nom de la
collection MongoDB** (`lunaevents`). Tout le reste avait été rebrandé ; la base
portait encore l'autre marque. Devenu `SolysEvent`, avec les cinq fichiers
qui l'importaient.

⚠️ **À connaître** : mongoose déduit le nom de la collection du nom du modèle.
Les écritures vont donc désormais dans `solysevents`, et d'éventuels documents
de `lunaevents` resteraient orphelins. Sans effet sur ce fork (aucun événement
réel en base). Si un jour il en existe :
`db.lunaevents.renameCollection("solysevents")`.

Autre détail : `coverEmoji` avait pour valeur par défaut **la lune** 🌙, posée
sur chaque événement de la version solaire. Le champ reste pour compatibilité,
sans valeur par défaut, et n'est plus affiché. La page, elle, titrait
« Événements Solys 🌙 » — la lune collée au nom solaire — et affichait la même
lune en grand dans l'état vide.

**Quatre contrôles manquaient à l'inscription :**

- **L'offre.** `eventsAccess` est `false` sur l'offre gratuite et `/tarifs` vend
  « Événements exclusifs » à partir d'Essentiel. **Aucune des deux routes ne
  lisait ce drapeau** : tout compte connecté pouvait s'inscrire.
- **La date.** On pouvait s'inscrire à un événement déjà passé.
- **La publication.** Un événement non publié était ouvert à qui avait son
  identifiant.
- **La place, pour de vrai.** L'ancienne version lisait l'événement, comparait
  `attendees.length` à `maxAttendees`, puis sauvegardait. Deux inscriptions
  simultanées sur la dernière place passaient **toutes les deux**. C'est
  maintenant un `findOneAndUpdate` dont le filtre porte la condition
  (`$expr: { $lt: [{ $size: "$attendees" }, "$maxAttendees"] }`) : MongoDB
  arbitre, pas l'ordre d'arrivée dans Node.

**Deux choix de conception :**

- **La liste reste visible par tous, l'inscription non.** Un événement à venir
  est un argument de vente ; le cacher n'aide personne. La réponse porte
  `peutSinscrire` pour que la page prévienne **avant** le clic au lieu de
  laisser découvrir le refus après. C'est un partage différent de `/circle`,
  entièrement fermé — mais le Circle *est* le contenu, alors qu'ici c'est la
  présence qui est vendue, pas l'affiche.
- **Se désinscrire est toujours permis**, avant les contrôles d'accès et quelle
  que soit l'offre : un abonnement qui expire ne doit pas enfermer quelqu'un
  dans une inscription.

Structure : comme `/matches`, la page maintenait **deux arbres de cartes**
(mobile / `md`), soit la même information écrite deux fois. Une seule carte
responsive.

### 🤝 VibeMentor n'était pas du coaching : devenu « Entraide » (28/09/2026)

La plus grosse tromperie tarifaire trouvée dans ce projet. `/tarifs` facturait
**« Coaching VibeMentor mensuel »** dans l'offre Elite à 34,99 €, et
`/fonctionnalites` promettait « coaching individuel », « ateliers
thématiques » et « ressources exclusives ».

Le modèle raconte autre chose. `MentorPost` porte une question, des **réponses
d'autres membres**, des votes et une réponse retenue. Aucun coach, aucun
professionnel, aucun atelier, aucune ressource. C'est un forum d'entraide entre
pairs — un bon produit, mais pas du coaching, et sûrement pas ce qui justifie
l'offre la plus chère du catalogue.

Décision de l'utilisateur : **nommer la fonctionnalité pour ce qu'elle est et
l'ouvrir à tous**. `/vibementor` → `/entraide` (avec redirection permanente
dans `next.config.ts`, pour ne pas casser les liens partagés),
`/api/vibementor` → `/api/entraide`, et le drapeau `vibementorCoaching`
supprimé de la configuration — **il n'était lu nulle part**, donc la
fonctionnalité était déjà ouverte à tous sans que personne le sache.

Le modèle garde son nom (`MentorPost`) : « mentor » est un mot commun, pas une
marque, et un second renommage de collection ne se justifiait pas.

**Deux champs dormaient depuis le début.** `isAccepted` et `isSolved`
n'étaient **jamais écrits**. Le modèle prévoyait qu'une question soit résolue
par une réponse retenue — c'est le principe même d'un forum d'entraide, et ce
qui le rend utile aux suivants — et rien ne permettait de le faire. L'action
`accept` existe, réservée à l'auteur de la question, et `isSolved` suit
l'existence d'une réponse retenue plutôt que d'être un drapeau séparé qui
pourrait dériver.

Mêmes protections ajoutées que sur la Communauté : filtre anti-harcèlement sur
les questions et les réponses, limite de débit, refus des comptes suspendus,
validation de la catégorie.

### 💸 L'offre Elite n'a plus de contrepartie propre — à décider

Avec le retrait de `vibementorCoaching`, l'inventaire des dix drapeaux de
fonctionnalité donne ceci :

| drapeau | appliqué ? |
|---|---|
| `circleOfSix` | ✅ depuis le 28/09 |
| `ghostMode` | ✅ (l'était déjà) |
| `profileVisitors` | ✅ (l'était déjà) |
| `eventsAccess` | ✅ depuis le 28/09 |
| `premiumFilters` | ✅ depuis le 28/09 (voir ci-dessous) |
| `unlimitedLikes` / `unlimitedMessages` | ✅ via les limites `Infinity` |
| `vipCommunity` | ❌ **lu nulle part** |
| `prioritySupport` | ❌ lu nulle part (promesse humaine, pas du code) |
| `vibementorCoaching` | 🗑️ supprimé |

Reste donc, pour justifier Elite à 34,99 € face à Premium à 19,99 € : 10 boosts
au lieu de 3, et `vipCommunity` — qui n'existe pas. « Cercle privé VIP »,
« Accès anticipé aux nouvelles fonctionnalités », « Rencontres organisées
exclusives » et « Support dédié 7j/7 » sont sur `/tarifs` sans contrepartie
dans le code. **C'est une décision de prix, pas de code** : à trancher avant
d'ouvrir les paiements.

### 🐛 L'offre Essentiel obtenait les filtres de Premium

`premiumFilters` vaut **false** sur Essentiel et `true` à partir de Premium,
mais `/api/profiles` et l'annuaire lisaient `isPremium` — vrai dès la première
offre payante. Un membre Essentiel obtenait donc l'orientation et le filtre
« actif récemment » qu'il n'avait pas payés. Les deux lisent maintenant le
drapeau, et l'API renvoie `filters.filtresAvances` pour que la page s'aligne
sans deviner.

La visibilité des profils réglés sur « premium » reste liée au fait d'avoir une
offre payante, quelle qu'elle soit : c'est un autre sujet, et le réglage dit
bien « membres payants », pas « membres Premium ».

### 🧾 /mon-compte — première passe : le fond (28/09/2026)

3 344 lignes, la plus grosse page du projet. Traitée en deux temps pour que
chaque étape reste vérifiable : **le fond d'abord** (ce commit), le visuel et la
découpe ensuite.

**La suppression de compte n'avait pas d'interface.** `DELETE /api/users/me`
existe depuis le début, complet — il annule l'abonnement Stripe, supprime les
photos Cloudinary, toutes les données liées, puis le compte — et **aucune page
ne l'appelait**. Ce n'est pas un détail : la politique de confidentialité
affirme que « la plupart de ces actions se font directement depuis ton espace
Mon Compte ». Le droit à l'effacement était annoncé et introuvable. Le bouton
existe, avec confirmation en deux temps (il faut écrire « SUPPRIMER »), sans
boîte de dialogue native.

**Quatre bugs d'affichage qui mentaient :**

- **La photo de profil annonçait un succès qu'elle n'enregistrait pas.**
  L'envoi vers Cloudinary est réel, mais la photo n'entre dans le profil qu'au
  « Sauvegarder » — et le message disait « Photo mise à jour avec succès ! ».
  Pire, le bouton restait actif **hors mode édition**, donc on pouvait
  « réussir » un changement qui n'était jamais enregistré. Le bouton est
  désactivé hors édition, et le message dit ce qui s'est réellement passé.
- **Les actions Stripe ne rafraîchissaient rien.** Pause, annulation,
  réactivation et synchronisation appelaient `router.refresh()` — sans effet
  ici, puisque la page charge son profil **côté client**. L'action réussissait,
  le message de succès s'affichait, et l'écran gardait l'ancien état jusqu'à un
  rechargement manuel. Remplacé par une vraie relecture du profil.
- **Le sélecteur de visibilité contournait la garde du Mode Fantôme.** Le
  basculeur juste au-dessus vérifie l'offre ; le `<select>` listait les quatre
  visibilités sans contrôle, donc proposait « invisible » à qui n'y a pas droit.
  Le serveur refusait bien, mais l'interface offrait une option vouée à l'échec.
- **« Question de sécurité définie » était cochée pour tout compte Google**,
  même sans question enregistrée — un indicateur de sécurité qui affichait une
  sécurité inexistante.

**Deux chiffres flattés :** le taux de complétion du profil comptait
`consentement` (toujours vrai dès l'inscription) et `rayon` (valeur par
défaut), donc un profil vide démarrait haut. Et un abonnement `inactive`
s'affichait « En attente », ce qui laissait croire à un traitement en cours.

**Restes du fork :** les orientations étaient au féminin, dont « Lesbienne /
Homosexuelle » ; l'écran de chargement affichait une **lune** lucide ; le plan
gratuit portait 🌙 comme pictogramme ; les types internes s'appelaient
`LunaPlan` et `LunaUser`. La clé d'orientation `curieuse` est **conservée en
plus** de `curieux` : elle a pu être enregistrée en base avant la reprise, et un
profil ne doit pas afficher une valeur brute parce qu'on a renommé une clé.

**28 chaînes vouvoyaient** alors que tout le reste du site tutoie. Et l'onglet
« Intéractions » portait une faute d'orthographe depuis l'origine.

**Dette de types : 21 → 16.** Les cinq erreurs restantes de `mon-compte`
venaient de `ease: "easeOut"` inféré `string` au lieu du littéral attendu par
framer-motion ; `as const` les fait disparaître.

**Reste pour la seconde passe** : 114 classes violettes/roses, 19 couleurs
hexadécimales codées en dur, 68 lignes avec emoji, et la découpe du fichier en
un composant par onglet. Les emojis n'ont **pas** été retirés dans cette passe :
certains servent d'illustration en `text-4xl` dans les états vides, et les
enlever sans refaire la mise en page laisserait des blocs vides.

### 🧾 /mon-compte — seconde passe : le visuel et la découpe (28/09/2026)

**3 550 lignes → 11 fichiers, 3 667 lignes.** (3 344 à l'origine ; la
première passe en a ajouté 200 avec la suppression de compte et les
corrections.) Le fichier contenait tout :
types, libellés, helpers, page, six onglets, deux modales, trois
sous-composants. Aucune partie n'était relisable seule, et corriger un onglet
imposait de faire défiler l'ensemble. Découpé en un composant par onglet dans
`_composants/`, plus un `types.ts` pour ce qui est réellement partagé. Le
total grossit légèrement : les en-têtes de fichier et les imports explicites
coûtent des lignes, et c'est le prix d'un fichier qu'on peut ouvrir seul.

La page passe dans le groupe `(app)`, donc l'URL ne change pas et elle hérite
du fond `abyss` et de la `Sidebar` persistante. Ce qui a permis de supprimer
**la nav du haut, qui doublait la Sidebar** : deux systèmes de navigation
simultanés, dont un redondant depuis la restructuration.

**Ce qui disparaît avec le fond violet :**

- **Le dégradé violet/rose et ses trois orbes flous.** La page vit maintenant
  sur `abyss`, comme le reste de l'espace connecté.
- **Le bloc `<style jsx global>`** : une feuille de style par page, avec la
  classe `.input-solys` et un anneau de focus violet codé en dur. Remplacé par
  les constantes `champ` et `focusRing` de `types.ts`. Au passage :
  `animate-msg-pulse`, l'animation de la pastille de message non lu, était
  déclarée **dans ce bloc** — la classe ne correspondait déjà plus à rien
  ailleurs, et la pastille est maintenant statique et plus lisible.
- **`planAccent` et `planEmoji`** : chaque offre avait sa teinte propre
  (violet pour Essentiel, rose pour Premium, or pour Elite) et son emoji. Un
  second système de couleurs superposé à celui de la marque. L'éclipse solaire
  n'a qu'un accent — orange pour l'action, lime pour la validation — et une
  offre se reconnaît à son nom.
- **Les quatre cartes de statistiques de l'accueil**, chacune dans une famille
  chromatique différente (violet, vert, jaune, bleu).
- **68 lignes avec emoji, 19 couleurs hexadécimales codées en dur, 114 classes
  violettes** : il en reste zéro en vigueur. Les six mentions de « violet » et
  le seul emoji restants sont dans les commentaires qui expliquent ce qui a été
  retiré.

L'anneau de complétion du profil passe du dégradé violet→rose à
`orange → lime` : lime quand le profil est complet, orange sinon. La couleur
dit enfin quelque chose.

**Trois promesses d'interface retirées ou corrigées :**

- **Les moyens de paiement étaient une liste décorative.** « Carte bancaire ·
  PayPal · Apple Pay · Google Pay » en `<span>` statiques, sans aucun lien avec
  les méthodes réellement activées côté Stripe — l'un des libellés avait même
  perdu son emoji, laissant une espace orpheline dans le tableau. Remplacé par
  ce qui est vrai : le paiement passe par Stripe, les moyens disponibles sont
  ceux que la page de paiement propose, et le site ne voit aucune donnée
  bancaire.
- **« Compte Stripe enregistré » figurait parmi les contrôles de sécurité.**
  La présence d'un `stripeCustomerId` ne dit rien de la sécurité d'un compte.
  Remplacé par « Identité vérifiée », qui en dit quelque chose.
- **La carte d'une mise en relation portait trois actions concurrentes** — la
  carte entière cliquable, un bouton « Voir ✨ » et un lien « Message » — dont
  deux menaient au même endroit. Reste la carte (vers le profil), « Message »
  (vers la conversation) et le signalement.

**Vérifié, pas supposé :** `/api/testimonials/me` et `/api/visitors` existent
bien tous les deux, et c'est la route `/api/visitors` qui refuse (403) un
membre sans offre payante — pas seulement cet écran. La bannière « témoigner »
n'apparaît qu'à un membre qui a au moins une mise en relation et n'a pas encore
témoigné.

**Âge minimum : `min={18}` → `min={28}`** dans le champ du profil. Le critère
d'inscription est 28 ans depuis le fork ; ce champ était resté à 18.

**Dette de types inchangée à 16**, build vert, 82 pages générées. Les 16
erreurs restantes sont toutes préexistantes et hors de cette page :
`models/User.ts` (13), `models/Subscription.ts` (2), `ui/Button.tsx` (1).

### 🌘 /auth — la carte qui bascule (28/09/2026)

Connexion et inscription ne sont plus deux onglets qui se remplacent, mais
deux moitiés d'une même carte. Le panneau solaire glisse d'un côté à l'autre
et découvre le formulaire qu'il cachait ; le discours qu'il porte s'échange
avec lui. 1 424 lignes → 839, plus une feuille dédiée.

**Pourquoi un module CSS et pas du Tailwind.** Le va-et-vient repose sur
quatre couches qui glissent ensemble, chacune avec sa translation et son
z-index. En classes utilitaires, cela ferait une dizaine de variantes
conditionnelles par élément. `auth.module.css` est de portée locale : rien ne
fuit dans le reste du site, et aucune feuille n'est injectée à l'exécution —
contrairement à l'ancienne page, qui créait un `<style>` dans le `<head>` au
montage pour son fond étoilé.

**L'éclipse est un masque, pas un disque posé dessus.** Première version : un
cercle sombre par-dessus le soleil. Le rendu le trahissait — l'ombre, plus
foncée que le panneau, se lisait comme une seconde boule. Avec un masque SVG,
le soleil est réellement découpé, et c'est le dégradé du panneau qui apparaît
dans l'échancrure. La couronne, elle, est un anneau à centre transparent :
comme dans une vraie éclipse, elle entoure le disque occulté au lieu de
briller derrière. L'ombre tourne en 34 s, l'orbite pointillée en sens inverse
en 72 s.

**Le panneau ne peut pas être orange plein.** Le crème sur #FF4103 tombe à
3,0:1, sous le seuil AA. Le panneau est donc un dégradé de rust, où le crème
tient 10,1:1 — et 4,9:1 au pire endroit, là où le halo orange du haut est le
plus dense. L'éclipse est volontairement décentrée en bas à gauche : si le
disque solaire passait derrière le texte, on retomberait à 3,0:1. Le
graphisme cède la place à la lisibilité.

**Trois corrections de fond :**

- **Le mot de passe était validé à 6 caractères côté page et à 8 côté
  serveur.** Un mot de passe de 6 ou 7 caractères passait la validation,
  partait à `POST /api/auth/register`, et revenait refusé. Les deux seuils
  sont alignés sur 8.
- **Les boutons Google et Apple s'affichaient toujours**, alors que NextAuth
  n'enregistre ces providers que si leurs variables d'environnement existent
  (`getOAuthProviders`). Sans clés — c'est l'état actuel du `.env.local` —
  le bouton menait à une page d'erreur. La page lit maintenant
  `/api/auth/providers`, la route que NextAuth expose déjà, et n'affiche que
  ce qui est réellement branché.
- **La colonne de gauche vantait « Cadeaux premium », « Événements VIP »,
  « App mobile exclusive » et un « Support 24h ».** Aucun des quatre n'a de
  code derrière. Remplacés par une seule ligne, vérifiable : identité
  vérifiée à l'inscription, 28 ans et plus.

**Accessibilité.** Les deux moitiés restent dans le DOM pendant qu'elles
glissent : sans précaution, la tabulation emmène dans le formulaire caché et
un lecteur d'écran annonce deux champs « mot de passe ». `inert` retire la
branche au repos du parcours clavier et de l'arbre d'accessibilité. Le
mouvement (glissement, orbites, entrée échelonnée des champs, parallaxe au
curseur) est désactivé sous `prefers-reduced-motion`, et la parallaxe l'est
aussi sur écran tactile.

**Sur mobile, plus rien ne glisse** : la carte se déplie, le panneau devient
un bandeau de 196 px et seule la moitié active s'affiche.

**Vérifié au rendu, pas seulement au build** : les trois états (inscription,
connexion, mobile) ont été rendus dans Chromium à partir du CSS et du
balisage réels. C'est ce rendu qui a montré que le disque d'ombre ne
fonctionnait pas et qu'il fallait passer au masque.

### 🚧 /inscription — le 401 qui arrivait à la fin (28/09/2026)

Un 401 sur `POST /api/users/update-profile`, au tout dernier bouton du
parcours d'inscription. La route faisait son travail : elle ne voyait pas de
session. C'est l'écran qui laissait avancer.

`/inscription` appelait `useSession()` mais ne traitait que
`status === "loading"`. Sans session, la page s'affichait quand même : on
pouvait remplir les cinq étapes — âge, orientation, intentions, localisation,
intérêts, question de sécurité — et ne l'apprendre qu'à l'envoi, sous la forme
d'un « Non autorisé. Veuillez vous connecter. » avec tout le formulaire perdu.

Deux corrections :

- **Une garde de session** : `status === "unauthenticated"` renvoie vers
  `/auth?mode=login` avant la première question.
- **Un 401 au moment de l'envoi se lit maintenant** : la session peut aussi
  disparaître en cours de route (cookie expiré, déconnexion dans un autre
  onglet). Le message dit ce qui s'est passé et emmène à la connexion, au lieu
  de laisser un « Non autorisé » sans suite.

**Ce que disaient les temps de réponse.** Dans le journal du serveur de
développement, `POST /api/auth/callback/credentials` répondait en 16 ms et
`GET /api/auth/session` en 15 ms. Une comparaison bcrypt à un coût de 12 prend
au bas mot 100 ms, et le callback `jwt` interroge Atlas à chaque lecture de
session : ces deux durées ne sont atteignables que si `authorize` est ressorti
avant bcrypt — compte introuvable — et s'il n'y avait aucun jeton à décoder.
Autrement dit la connexion n'avait pas pris, et le parcours s'est poursuivi
comme si de rien n'était. C'est exactement ce que la garde empêche désormais.

### ☀️ Un palier de luminosité (29/09/2026)

Le site était lu comme trop sombre. Quatre paliers de fond ont été rendus côte
à côte, avec les mêmes composants et les mêmes niveaux de texte, pour choisir
en regardant plutôt qu'en décrivant. Palier retenu : **le fond passe de
`#001724` à `#04202E`, la surface des cartes de `#0C222D` à `#123243`.**

C'est le seul cran où tout reste conforme AA, orange compris : `text-abyss`
sur un bouton orange plein garde 4,80:1 (contre 5,23:1 avant), et l'orange en
texte sur le fond 4,80:1 aussi. Au palier suivant, les deux tombaient sous le
seuil.

**Le vrai responsable de la pénombre n'était pas le fond.** 43 occurrences de
texte crème sous 50 % d'opacité — `/45`, `/40`, `/35`, `/30` — étaient déjà
sous le seuil de lisibilité avant ce changement : 3,99:1 pour `/45`, 2,44:1
pour `/30`. Ce sont elles qui donnaient l'impression que la page s'éteignait.
Plancher relevé en conservant la hiérarchie : `/30` et `/35` passent à `/55`,
`/40`, `/45` et `/50` à `/60`. 56 remplacements.

**Ce que le palier a coûté, et qu'il a fallu payer.** En petit texte, l'orange
passait de justesse sur l'ancienne surface (4,69:1) ; sur la nouvelle il tombe
à 3,84:1. Ce n'était plus tenable, et la règle du projet le disait déjà —
l'orange aux accents et aux gros éléments, pas au petit texte. 30 libellés de
liens et de boutons fantômes en 12-13 px sont passés en `cream` dans 22
fichiers. L'orange ne quitte pas ces éléments : il reste dans la bordure, dans
l'icône, et dans le soulignement `.fx-link` qui se déploie au survol. Les 16
`hover:text-cream` devenus sans effet ont été retirés dans la foulée.

**La surface était écrite en dur dans 42 fichiers** — 126 occurrences de
`#0C222D`, plus 13 de `#001724`. Sans ce balayage, les cartes seraient restées
à leur ancienne valeur, c'est-à-dire presque exactement la luminosité du
nouveau fond : elles auraient disparu dedans. Les deux tokens Tailwind et les
variables `--abyss` / `--surface` de `globals.css` ont été mis à jour de
concert.

Au passage, `ReportModal` — composant partagé, ouvert depuis la Communauté et
depuis l'onglet Interactions — portait encore le dégradé violet de SferaLuna
(`#1a0b2e` → `#2d1b69`). Il est passé sur la surface de la charte. Il reste des
violets hérités dans `/admin` et `/paiement`, les deux pages non migrées : on
les traitera avec elles, pas à moitié.

**Le tableau des règles de contraste a été entièrement recalculé** — les
valeurs documentées depuis le 25/09 portaient sur l'ancien fond et ne
disaient plus la vérité. Une troisième règle a été ajoutée : l'orange n'est
pas une couleur de texte courant.

### Reste à faire ❌

- [ ] **Pages encore sur l'identité SferaLuna** (violets codés en dur, structure d'origine). Migrées à ce jour : `/`, `/tarifs`, `/fonctionnalites`, `/commencer`, `/temoignages`, `/guide`, `/faq`, `/auth`, `/auth/reset-password`. Restent : `/histoire /valeurs /equipe /contact` (atteignables depuis les mega-menus, donc prioritaires), `/inscription`, les pages légales, puis les deux dernières pages de l'espace connecté, `/paiement` et `/admin`. La marque et le genre y sont corrigés depuis le balayage de fond — c'est le visuel et la structure qui restent.
- [ ] **`/public/og-image.png`** — régénérer une vraie image de partage Sfera'Solys (le fichier actuel est un placeholder quasi vide, hérité)
- [ ] **Contenu témoignages en base MongoDB** — le composant d'affichage est rebrandé, mais les données existantes (si seed SferaLuna) n'ont pas été vérifiées/nettoyées
- [ ] `README.md` — réécrire
- [ ] `PROMPT_APP_MOBILE.md` — adapter
- [ ] `auth.config.backup.js` — vérifier / nettoyer / supprimer
- [ ] `.npmrc` — retirer tout token privé hérité (commit « passe dédiée » côté SferaLuna)
- [ ] Fichier racine `sferaluna-app-icon-1024.png` — obsolète (remplacé par `public/app-icon-1024.png`, non référencé dans le code), à déplacer/supprimer
- [ ] **`/histoire` — page à réécrire, pas à corriger** : la marque et le genre y ont été corrigés, mais le récit lui-même reste celui de SferaLuna (« les applications ne sont pas conçues pour les femmes → nous avons créé ceci »). L'histoire fondatrice de Sfera'Solys n'est pas inventable : c'est au porteur du projet de la raconter. En l'état la page n'est plus fausse sur sa cible, mais elle ne raconte pas encore la bonne histoire.
- [ ] **16 erreurs de types préexistantes** — voir la section Vérification ci-dessus ; masquées par `ignoreBuildErrors`.
- [ ] **Critère d'inscription / cible** : vérifier que la copy et les visuels des pages non traitées (onboarding, profil, formulaires) sont bien orientés hommes 28+, sans présomption d'orientation
- [ ] **OAuth** : nouveau projet Google Cloud + Services ID Apple pour le domaine Sfera'Solys (redirect URIs, `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` alignés sur le domaine canonique)
- [ ] **Domaine** : sferasolys.fr/.com + déploiement Vercel séparé
- [ ] **Secrets** : régénérer Stripe (produits + prix + webhook), Pusher, Cloudinary, Resend, Google/Apple OAuth
- [ ] Favicon 16×16/32×32 — lisibilité limitée avec ce logo détaillé ; simplifier si besoin une fois vu en conditions réelles

> Vérifs utiles pendant le rebranding :
> ```bash
> grep -Rni "sferaluna" src public scripts *.md *.json *.js *.ts
> grep -Rni "luna" src/models src/app | grep -vi "vibe"
> grep -Rn "1a0b2e\|2d1b69\|3a2a82\|8E7AB5\|5B4B8A\|purple-600\|pink-600" src
> ```

⸻

## 🏗️ Restructuration de l'architecture — décidée le 25/09/2026

Constat de l'utilisateur : recolorer ne suffit pas, le site est encore « trait pour trait » SferaLuna dans sa structure (nav, hiérarchie des pages, emplacement des boutons). Décision : refonte structurelle en gardant **toutes** les fonctionnalités existantes.

Maquettes explorées et direction retenue : voir l'artifact de maquettes `https://claude.ai/artifact/2TD2kNDoqzXgHKCu4G5kxK` (canvas avec les 5 concepts de palette + directions structurelles A/B + le mockup final retenu `DirA-Dashboard.dc.html`).

**Direction retenue = hybride** :

* **Côté public (déconnecté)** — Direction A « dossier de vérification », ton institutionnel/sérieux :
  * nav resserrée en mega-menus (3-4 entrées : découvrir / comment ça marche / communauté / tarifs) au lieu des 5 pilules à plat actuelles ;
  * bouton d'inscription du header : simple lien texte « rejoindre → », pas de gros bouton plein ;
  * home refaite comme un parcours narratif plutôt qu'un template hero → grille de features → témoignages → CTA : hero avec sceau de vérification (pas l'éclipse glossy), stepper vertical « comment ça marche » (4 étapes), bandeau de badges de confiance, **un seul** témoignage éditorial en grand format (pas une grille de petites cartes), **un seul** CTA fort en bas de page ;
  * nouvelle **vue annuaire** en liste (alternative fonctionnelle au swipe façon Tinder) pour parcourir les profils de façon plus posée — dispo en plus du mode découverte swipe existant, pas en remplacement.
* **Côté connecté** — sidebar verticale persistante (`Sidebar.tsx`, créé) inspirée de la direction B « le cercle » : remplace Header/Footer pour toutes les pages de l'espace membre. Items : accueil, explorer, matches, cercle & communauté (sous-menu dépliable : Circle of Six, VibeSphere, VibeMentor, VibePlanner, Mode Fantôme, Événements, Communauté), messages (badge notif), premium, + chip utilisateur (mon dossier / déconnexion) en bas.

### Constat technique important

Il n'y a **pas** de route groups Next.js aujourd'hui : chaque `page.tsx` importe `Header`/`Footer` individuellement (19 fichiers). La restructuration est l'occasion de basculer vers deux groupes `src/app/(marketing)/` (Header/Footer, direction A) et `src/app/(app)/` (layout commun avec `Sidebar.tsx`, pages connectées) — les route groups ne changent pas les URLs (`(app)/explorer/page.tsx` reste servi sur `/explorer`).

Répartition envisagée (à affiner page par page pendant la migration) :

* **`(marketing)`** : `/` (home), `/histoire`, `/valeurs`, `/temoignages`, `/equipe`, `/fonctionnalites`, `/tarifs`, `/guide`, `/faq`, `/commencer`, `/contact`, `/accessibilite`, `/conditions`, `/confidentialite`, `/cookies`, `/auth`, `/inscription`
* **`(app)`** : `/explorer`, `/circle`, `/communaute`, `/evenements`, `/mode-fantome`, `/vibementor`, `/vibeplanner`, `/vibesphere` (+ `/vibesphere/journal`), `/matches`, `/messages/[matchId]`, `/profil/[id]`, `/mon-compte`, `/paiement`
* **hors périmètre nav** : `/admin` (zone à accès restreint, traitée séparément)

### Roadmap de migration (phases)

1. ✅ **Fondations (fait le 25/09/2026)** — `src/app/(app)/layout.tsx` créé (wrapper `Sidebar`), page pilote `/explorer` migrée dans `src/app/(app)/explorer/page.tsx` (imports + usages `Header`/`Footer` retirés, `pt-16 sm:pt-24` → `pt-6 sm:pt-8` puisqu'il n'y a plus de header fixe à compenser). L'ancien `src/app/explorer/page.tsx` a été **déplacé** (pas supprimé) vers `_migrated-out-of-app-router/explorer-page.tsx.bak` à la racine pour éviter le conflit de route Next.js — à supprimer une fois la migration validée. ⚠️ Le contenu de la page est encore 100 % SferaLuna (dégradé violet/rose codé en dur) : seule la structure de nav a changé.
2. **Généralisation `(app)`** — migrer les pages restantes de la liste `(app)` ci-dessus vers le nouveau groupe, retirer leurs imports `Header`/`Footer` individuels.
3. ✅ **Nav publique direction A (fait le 25/09/2026)** — `Header.tsx` réécrit : fond sombre permanent (plus de bascule clair/sombre au scroll), 4 entrées de premier niveau (`découvrir ▾` / `comment ça marche ▾` / `communauté` → `/temoignages` / `tarifs`), CTA en lien texte « rejoindre → » (plus de bouton dégradé), dropdown d'auth supprimé au profit de deux liens directs, icônes lucide au lieu des emojis, `useReducedMotion` respecté, anneaux de focus clavier explicites. **Hauteurs conservées** (`h-14 sm:h-16 xl:h-20`) : toutes les pages non migrées compensent le header fixe avec `pt-16 sm:pt-20`, changer la hauteur les ferait passer sous le header. Reste à faire : migrer les pages `(marketing)` vers leur propre groupe de routes.
4. ✅ **Home narrative (fait le 25/09/2026)** — `src/app/page.tsx` réécrit d'après `DirA-Home.dc.html` : 1486 → ~330 lignes. Supprimés : `GrainOverlay`, `DriftingSparkles`, `AmbientOrbs`, `CrescentMoon`, `OrbitGlow`, `TiltCard`, `HeroPortrait`, barre de progression de scroll, parallax lié au scroll, grille des 6 fonctionnalités, section ADN/valeurs en accordéon, les 4 tuiles de stats. Nouvelles sections : hero avec sceau de vérification (SVG de la maquette) + un seul chiffre live (`/api/stats` → `membres`), stepper vertical 4 étapes, bandeau de 4 badges de confiance, témoignage unique en Fraunces italique (`/api/testimonials`, priorité au témoignage `featured`, lien vers `/temoignages` pour le reste), CTA final unique. `TestimonialsCarousel`, `HexagonSix` et `ui/Sun` restent utilisés par `/fonctionnalites` et `/circle` — rien n'est devenu du code mort.
5. **Vue annuaire** — implémenter la bascule annuaire/découverte sur `/explorer` (déjà en `use client`, logique swipe existante à conserver intacte, annuaire = nouveau mode d'affichage alternatif).
6. **Mobile de la sidebar** — équivalent tab bar basse pour l'espace connecté sur mobile (voir maquette `DirB-Mobile.dc.html` pour la référence visuelle — l'onglet « cercle » mis en avant, pas noyé).
7. **Nettoyage nommage** — renommer les classes `bg-teal`/`text-rust` (qui ne rendent plus du tout teal/rust depuis le remap de palette) au fil des pages migrées, pour que le code redevienne lisible.

### 🔎 Audit du 25/09/2026 — le rebranding est beaucoup moins avancé que cette fiche ne le laissait croire

En refondant `/tarifs`, `/fonctionnalites` et `/commencer`, constat : ces pages n'avaient **jamais** été rebrandées. Pas « mal colorées » — littéralement encore SferaLuna, violets `#8E7AB5` / `#D9B8FF` / `#9D4EDD` codés en dur, zéro token de marque, et une copy adressée à des femmes. Échantillon de ce qui était en ligne :

* `/tarifs` : « Découvre SferaLuna à ton rythme », « Offres SferaLuna », « Communauté Luna », « Pour les plus engagées », « réduction de 30 % pour les étudiantes », « Rejoins des femmes qui veulent des connexions plus vraies »
* `/commencer` : « Une expérience repensée pour les femmes qui aiment les femmes »
* `/fonctionnalites` : « Rejoins des femmes qui utilisent déjà SferaLuna », « Événements Luna »
* `/temoignages` : titre SEO « Elles parlent de SferaLuna », description « des femmes qui ont trouvé… », JSON-LD déclarant à Google `name: "SferaLuna"` + « pensé pour les femmes qui aiment les femmes », et **URL canonique de repli `https://sferaluna.com`**

**Chiffrage à l'échelle du projet : 277 occurrences de « SferaLuna » / « sferaluna » dans 90 fichiers** (`src/**/*.ts`, `src/**/*.tsx`), métadonnées SEO, layouts, routes d'API et tests compris. La copy genrée au féminin touche au moins `/guide`, `/valeurs`, `/auth`, `/faq` en plus des pages déjà traitées.

Priorité recommandée : ce chantier passe **avant** la suite de la refonte visuelle. Une page moche qui dit la bonne marque est moins grave qu'une belle page qui annonce au visiteur — et à Google — qu'il est sur une plateforme pour femmes appelée SferaLuna. Méthode conseillée : traiter d'abord les métadonnées SEO et les JSON-LD (invisibles à l'œil, mais ce sont eux qui sont indexés), puis la copy visible page par page, en relisant chaque remplacement à la main — un `sed` global casserait les noms de variables, les tests et les `dbName`.

### ⚠️ État intermédiaire assumé (à ne pas prendre pour des bugs)

Tant que la migration page par page n'est pas terminée, le site est volontairement hétérogène :

* le **header est sombre** (`bg-abyss`) mais la plupart des pages ont encore un contenu clair hérité (`bg-cream`/`white`) — seule la home est passée en sombre. Le raccord header/contenu sera propre page par page, au fil de la phase 2/3 ;
* `/explorer` affiche la **sidebar sombre à côté d'un contenu violet/rose** SferaLuna non rebrandé ;
* les liens `bg-teal` / `text-rust` rendent des couleurs qui ne correspondent plus à leur nom (voir phase 7).

**Convention à reprendre sur chaque page migrée :** le `<main>` doit porter `id="contenu"`, cible du lien d'évitement du header. Le lien retombe sur le premier `<main>` de la page via JS si l'id est absent, donc les pages non migrées ne sont pas cassées — mais l'id est la version propre. Fait sur `/`, `/tarifs`, `/fonctionnalites`, `/commencer`, `/temoignages`.

Ordre de passage conseillé pour la suite : finir la cohérence visuelle des pages `(marketing)` les plus vues (`/tarifs`, `/fonctionnalites`, `/commencer`, `/temoignages`) avant d'attaquer la généralisation `(app)`, pour que le site public soit présentable de bout en bout au plus vite.

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