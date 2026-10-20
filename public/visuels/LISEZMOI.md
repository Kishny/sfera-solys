# Visuels — direction « nuit cuivrée »

Convertis depuis `public/new-visuel/` (onze PNG, 20 Mo au total) en WebP
2048 px de large, qualité 80 : **1,1 Mo au total**, soit 95 % de moins. Les
PNG d'origine ne sont pas suivis par git ; ils restent sur le disque comme
source si une nouvelle passe de conversion devient nécessaire.

## Photographies — utilisables comme contenu

| Fichier         | Sujet                                                |
|-----------------|------------------------------------------------------|
| `solys-01.webp` | Deux hommes sur un rooftop, éclipse au-dessus de la skyline |
| `solys-01-hero.webp` | La même, recadrée sur les deux hommes (30 % retirés à gauche) — c'est elle qu'utilise le héros de la page d'accueil |
| `solys-02.webp` | Terrasse déserte à la bougie, piscine à débordement   |
| `solys-03.webp` | Homme seul de profil, verre à la main, skyline        |
| `solys-04.webp` | Terrasse en marbre noir, reflets, piscine             |
| `solys-05.webp` | Groupe de quatre hommes, conversation                 |
| `solys-06.webp` | Épaule et nuque en contre-jour doré, cadrage serré    |
| `solys-07.webp` | Homme de dos devant une baie vitrée, veste à la main  |
| `solys-08.webp` | Réception au bord d'une piscine, lanternes            |

`solys-06` et `solys-07` ont de larges aplats sombres à gauche : ce sont les
deux seules où une accroche peut être posée directement sur l'image sans
voile supplémentaire.

## Maquettes — référence, jamais servies

`maquettes/accueil.webp`, `maquettes/inscription.webp` et
`maquettes/explorer.webp` sont les écrans de référence de la direction
artistique. Elles ne sont pas du contenu : rien dans `src/` ne doit les
importer.

## Résolution

Les sources font 1672 px de large. C'est suffisant pour un affichage
simple, mais un recadrage serré comme `solys-01-hero.webp` (1170 px) sera
légèrement doux sur un écran à forte densité. Si de nouveaux visuels sont
générés, demander des exports plus larges — 2560 px laisserait de la marge
pour recadrer sans perte visible.

## Portraits d'aperçu — `profils/`

`profil-01.webp` à `profil-07.webp`, 512 × 512, recadrés depuis six sources
de `public/new-visuel/` datées du 20 octobre. Quatre venaient de portraits
seuls ; `profil-05` et `profil-06` sont des visages découpés dans deux
scènes de groupe, le cadrage ayant été calé sur une détection de visage
plutôt qu'à l'œil. `profil-07` est un septième visage, pris dans la même
scène de groupe que `profil-05` mais sur un autre homme ; il sert au
panneau « Ton profil » du parcours, et n'est pas dans les aperçus pour que
le même visage ne se retrouve pas à deux titres différents sur la page.

Ils servent **uniquement** aux avatars des aperçus d'interface
(`InterfacePreviews.tsx`). Ce sont des photographies générées, pas des
membres : la légende sous chaque aperçu le dit, et c'est elle qui rend
l'illustration honnête. Voir l'en-tête de `InterfacePreviews.tsx`, qui
documente la levée de la règle « aucun visage » et les deux garde-fous
conservés.

Limite connue : les six sources partagent la même terrasse, le même
crépuscule et la même chemise noire, et se répartissent en deux
physionomies proches. Les trois visages les plus distincts occupent la
rangée du haut du Circle ; les plus ressemblants sont renvoyés aux
vignettes de 36 px de l'annuaire. Si de nouveaux portraits sont générés,
demander des décors, des tenues et des âges apparents franchement
différents.

## Visuels du pied de page

| Fichier         | Sujet                                                     |
|-----------------|-----------------------------------------------------------|
| `solys-09.webp` | Terrasse et piscine à débordement, ville au loin — fond du pied de page |
| `solys-10.webp` | Terrasse sombre, bougies, baie vitrée                      |
| `solys-11.webp` | Panorama très large, lumières de la ville                  |
| `solys-12.webp` | Dégradé sombre presque uni, utilisable comme fond neutre   |

Convertis depuis quatre PNG du 20 octobre, bornés à 2048 px de large :
168 Ko au total contre 6,4 Mo en source.

Seul `solys-09` est servi aujourd'hui, sous un voile `nuit/88`. Cette
valeur n'est pas choisie à l'œil : le pied de page porte plus de petit
texte que n'importe quelle autre partie du site, et à 88 % le champagne à
55 % y tient 4,66:1 sur les lumières de la ville, juste au-dessus du seuil.
Un voile plus clair fait passer la barre basse sous la limite.
