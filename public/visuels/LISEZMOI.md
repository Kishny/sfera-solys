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
