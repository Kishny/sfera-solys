import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Camera,
  CircleSlash,
  EyeOff,
  FileCheck,
  Heart,
  HelpCircle,
  Hourglass,
  Infinity as IconeInfini,
  ShieldCheck,
  Signpost,
  Star,
  Users,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EclipseMark from '@/components/brand/EclipseMark';
import {
  Surtitre,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from '@/components/brand/mise-en-page';

/**
 * Page « Notre histoire » — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Elle redevient un composant serveur
 *
 * L'ancienne version était `'use client'` pour une seule raison : un
 * `fetch('/api/stats')` au montage, qui alimentait une bande de compteurs.
 * La maquette n'en montre aucun. L'appel part, la directive avec, et la
 * page n'embarque plus une ligne de JavaScript côté client — ce qui, pour
 * une page de récit sans interaction, est exactement ce qu'il faut.
 *
 * ## Ce que le texte doit et ne doit pas
 *
 * Le récit a été écrit lors de la réécriture précédente, après le retrait
 * d'une chronologie datée (« Printemps 2024 », « Été 2024 ») qui
 * appartenait au projet d'origine : inventer des jalons, c'est fabriquer
 * un passé. La page tient sans dates — un constat, un parti pris, ce qu'on
 * a refusé de faire, et le nom.
 *
 * Une formulation de la maquette a été ajustée parce qu'elle affirmait
 * plus que le code : « Seuls les profils vérifiés peuvent échanger sur la
 * plateforme ». `identityVerified` n'est lu par aucune route serveur comme
 * condition d'accès ; il n'existe qu'un garde-fou côté client sur
 * `/mon-compte`. Ce qui est vrai, c'est que la vérification est demandée à
 * l'inscription. Le texte dit donc la règle, pas une garantie technique
 * qui n'est pas encore posée.
 *
 * ## Les visuels
 *
 * La maquette illustre le constat par trois images conceptuelles (des
 * téléphones, des bulles de conversation, un panneau indicateur) et le
 * parti pris par une pièce d'identité et un passeport posés sur un
 * bureau. Aucune n'existe, et la dernière est précisément celle qu'il ne
 * faut pas fabriquer : un document d'identité inventé sur la page qui
 * explique la vérification.
 *
 * Ces emplacements portent donc des panneaux composés — dégradé de la
 * charte, éclipse atténuée, pictogramme en grand. Les photographies de
 * terrasse, elles, viennent du jeu existant.
 */

/** Ce que la maquette appelle « Le constat ». */
const constats: Array<{ icon: IconeMarque; titre: string; texte: string }> = [
  {
    icon: Users,
    titre: 'Trop de profils',
    texte:
      "Des milliers de profils à portée de pouce, dont beaucoup sont inactifs, incomplets ou peu sérieux. La quantité ne remplace pas la certitude d'avoir quelqu'un de réel en face.",
  },
  {
    icon: HelpCircle,
    titre: 'On ne sait pas à qui on parle',
    texte:
      "Une photo, un prénom, et rien derrière. Sans vérification, personne n'a jamais contrôlé que la personne existe — et c'est le membre qui porte le risque.",
  },
  {
    icon: Signpost,
    titre: 'Des intentions floues',
    texte:
      "Les intentions ne sont pas toujours claires, ce qui mène aux malentendus et aux expériences frustrantes. On perd du temps, des deux côtés.",
  },
];

/** Les quatre temps de la vérification. */
const partiPris: Array<{ icon: IconeMarque; titre: string; texte: string }> = [
  {
    icon: FileCheck,
    titre: 'Document officiel',
    texte:
      "Une pièce d'identité en cours de validité : carte d'identité, passeport ou titre de séjour.",
  },
  {
    icon: Camera,
    titre: 'Selfie en direct',
    texte:
      "Un selfie pour confirmer que c'est bien toi, pris sur le moment et jamais publié sur ton profil.",
  },
  {
    icon: ShieldCheck,
    titre: 'Vérification sécurisée',
    texte:
      "La comparaison est faite par Stripe Identity. Nous n'en conservons que le résultat : vérifié, ou non.",
  },
  {
    icon: Star,
    titre: 'Gratuit pour tous',
    texte:
      "Entièrement gratuite, quelle que soit l'offre choisie. Aucune carte bancaire n'est nécessaire.",
  },
];

/** Ce que le parti pris coûte, et ce qu'il rapporte. */
const contreparties: Array<{ icon: IconeMarque; titre: string; texte: string }> = [
  {
    icon: Hourglass,
    titre: 'Une démarche supplémentaire',
    texte: 'pour plus de sécurité.',
  },
  {
    icon: BarChart3,
    titre: 'Une croissance plus mesurée',
    texte: 'mais plus qualitative.',
  },
  {
    icon: Heart,
    titre: 'Plus de confiance',
    texte: 'et des échanges plus authentiques.',
  },
];

/** Ce qu'on a choisi de ne pas faire. */
const refus: Array<{ icon: IconeMarque; titre: string; texte: string }> = [
  {
    icon: IconeInfini,
    titre: 'Le défilement infini',
    texte:
      "Nous ne proposons pas de défilement infini. À la place, six profils par semaine avec le Circle of Six, renouvelés chaque lundi. Assez pour choisir, trop peu pour consommer.",
  },
  {
    icon: EyeOff,
    titre: 'Les profils non vérifiés',
    texte:
      "La vérification d'identité est demandée à l'inscription, sans exception et sans possibilité de passer devant. C'est la règle qui tient tout le reste.",
  },
  {
    icon: CircleSlash,
    titre: 'Les mises en avant cachées',
    texte:
      "Les boosts de visibilité existent, durent trente minutes et sont plafonnés par l'offre. Ce qu'on refuse, c'est la place achetée en silence : la carte affiche « Mis en avant » pendant toute la durée.",
  },
  {
    icon: Users,
    titre: 'Les faux profils de vitrine',
    texte:
      "Nous ne créons aucun profil pour donner l'illusion d'une activité. Même les aperçus d'interface du site n'affichent aucun membre inventé.",
  },
];

/** Panneau composé, là où la maquette place une image qui n'existe pas. */
function PanneauCompose({
  id,
  icon: Icone,
}: {
  id: string;
  icon: IconeMarque;
}) {
  return (
    <div
      aria-hidden="true"
      className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-minuit via-nuit to-minuit"
    >
      <EclipseMark
        id={id}
        attenuation={0}
        className="pointer-events-none absolute -right-8 top-1/2 h-[200px] w-[200px] -translate-y-1/2 opacity-[0.18]"
      />

      <Icone
        size={70}
        className="absolute left-7 top-1/2 -translate-y-1/2 text-cuivre/20"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-minuit via-transparent to-transparent" />
    </div>
  );
}

export default function HistoirePage() {
  return (
    <>
      <Header />

      <main id="contenu" className="bg-nuit text-champagne">
        {/*
          Héros. `solys-04` est la photographie où l'éclipse est la plus
          lisible au-dessus de la skyline — c'est celle que dessine la
          maquette. Voile vertical sous `lg` : 93 % au milieu, 75 % en haut.
        */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[38%]">
            <Image
              src="/visuels/solys-04.webp"
              alt="Une terrasse déserte éclairée à la bougie, l’éclipse au-dessus de la ville."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/93 to-nuit/75 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/30 lg:to-transparent"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-14 sm:pb-16 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>Notre histoire</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[48px]">
                Pourquoi ce
                <br />
                <span className="italic text-cuivre">site existe.</span>
              </h1>

              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-champagne/80 sm:text-[15px]">
                Sfera&rsquo;Solys est né d&apos;une envie simple : offrir un
                espace de rencontres entre hommes, plus sûr, plus respectueux
                et plus authentique, où les vrais profils sont mis en avant
                grâce à la vérification d&apos;identité.
              </p>

              <Link
                href="#demarche"
                className={`mt-8 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Découvrir notre démarche
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Le constat */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[34px]">
              Le <span className="italic text-cuivre">constat.</span>
            </h2>

            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-champagne/80">
              Aujourd&apos;hui, de nombreuses plateformes de rencontre
              présentent des limites qui rendent les échanges parfois
              décevants, voire risqués.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {constats.map(({ icon: Icone, titre, texte }, index) => (
                <li key={titre} className="h-full">
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-champagne/12 bg-minuit/80">
                    <PanneauCompose id={`histoire-constat-${index}`} icon={Icone} />

                    <div className="relative flex flex-1 flex-col px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                      <span
                        aria-hidden="true"
                        className="absolute -top-6 left-5 flex h-12 w-12 items-center justify-center rounded-full border border-cuivre/45 bg-nuit text-cuivre sm:left-6"
                      >
                        <Icone size={19} />
                      </span>

                      <h3 className="font-display mt-10 text-[19px] font-normal leading-snug text-ivoire">
                        {titre}
                      </h3>

                      <p className="mt-2.5 text-[12.5px] leading-relaxed text-champagne/75">
                        {texte}
                      </p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Notre parti pris */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div
            id="demarche"
            className="relative isolate mx-auto max-w-7xl scroll-mt-28 overflow-hidden rounded-3xl border border-champagne/12 bg-minuit/70 p-6 sm:p-8 lg:p-10 xl:scroll-mt-32"
          >
            <EclipseMark
              id="histoire-parti-pris"
              attenuation={0}
              withCorona
              className="pointer-events-none absolute -right-16 top-1/2 h-[280px] w-[280px] -translate-y-1/2 opacity-20 lg:right-[1%] lg:h-[340px] lg:w-[340px]"
            />

            <div className="relative">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[34px]">
                Notre parti pris&nbsp;:{' '}
                <span className="italic text-cuivre">vérifier d&rsquo;abord.</span>
              </h2>

              <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-champagne/80">
                Nous avons fait le choix de placer la vérification
                d&apos;identité au cœur de l&apos;expérience, pour créer un
                espace plus serein et plus fiable.
              </p>

              <ol className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-champagne/15">
                {partiPris.map(({ icon: Icone, titre, texte }, index) => (
                  <li key={titre} className="lg:px-5 lg:first:pl-0 lg:last:pr-0">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                    >
                      <Icone size={19} />
                    </span>

                    <h3 className="font-display mt-4 text-[16px] font-normal leading-snug text-ivoire">
                      {index + 1}. {titre}
                    </h3>

                    <p className="mt-2 text-[12.5px] leading-relaxed text-champagne/75">
                      {texte}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Ce choix a un prix */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto grid max-w-7xl items-stretch gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_minmax(0,0.9fr)]">
            <div className="relative min-h-[220px] overflow-hidden rounded-3xl border border-champagne/12">
              <Image
                src="/visuels/solys-02.webp"
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover object-center"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-nuit/60 via-transparent to-transparent"
              />
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                Ce choix a un prix…
                <br />
                et une <span className="italic text-cuivre">valeur.</span>
              </h2>

              <p className="mt-5 text-[13.5px] leading-relaxed text-champagne/80">
                La vérification demande une étape supplémentaire par rapport à
                d&apos;autres plateformes, ce qui rend la croissance plus
                mesurée. C&apos;est le vrai coût : la démarche rebute, et elle
                écarte d&apos;emblée ceux qui ne voulaient pas être
                identifiables.
              </p>

              <p className="mt-4 text-[13.5px] leading-relaxed text-champagne/80">
                C&apos;est aussi tout son intérêt. Cette exigence permet de
                bâtir une communauté plus saine, plus respectueuse et plus
                conviviale, où chaque rencontre a plus de chances d&apos;être
                une vraie rencontre.
              </p>
            </div>

            <ul className="flex flex-col justify-center gap-6 lg:pl-2">
              {contreparties.map(({ icon: Icone, titre, texte }) => (
                <li key={titre} className="flex items-start gap-3.5">
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                  >
                    <Icone size={18} />
                  </span>

                  <p className="text-[12.5px] leading-relaxed text-champagne/80">
                    <span className="block font-semibold text-champagne">
                      {titre}
                    </span>
                    {texte}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ce qu'on a choisi de ne pas faire */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[34px]">
              Ce que nous avons choisi de{' '}
              <span className="italic text-cuivre">ne pas faire.</span>
            </h2>

            <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-champagne/80">
              Un produit se définit autant par ce qu&apos;il refuse que par ce
              qu&apos;il propose.
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {refus.map(({ icon: Icone, titre, texte }) => (
                <li
                  key={titre}
                  className="h-full rounded-2xl border border-champagne/12 bg-minuit/80 p-5 sm:p-6"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-cuivre/40 bg-nuit/60 text-cuivre"
                  >
                    <Icone size={19} />
                  </span>

                  <h3 className="font-display mt-4 text-[17px] font-normal leading-snug text-ivoire">
                    {titre}
                  </h3>

                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-champagne/75">
                    {texte}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pourquoi Solys */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="relative isolate mx-auto flex max-w-7xl flex-col gap-8 overflow-hidden rounded-3xl border border-champagne/12 bg-minuit/70 p-6 sm:p-9 lg:flex-row lg:items-center lg:gap-14 lg:p-11">
            <div className="max-w-xl">
              <h2 className="font-display text-[26px] font-normal leading-tight text-ivoire sm:text-[34px]">
                Pourquoi <span className="italic text-cuivre">Solys&nbsp;?</span>
              </h2>

              <p className="mt-5 text-[13.5px] leading-relaxed text-champagne/80">
                Solys fait référence au soleil, l&apos;étoile qui éclaire,
                rassemble et symbolise la chaleur, la sincérité et
                l&apos;énergie positive.
              </p>

              <p className="mt-4 text-[13.5px] leading-relaxed text-champagne/80">
                Le symbole est une éclipse : un disque qui en mord un autre et
                laisse un anneau. On y a vu ce que fait la vérification —
                cacher juste ce qu&apos;il faut pour que le reste devienne
                regardable. L&apos;apostrophe du nom est ce point solaire.
              </p>
            </div>

            {/*
              `EclipseMark` peint avec `currentColor`. Sans couleur explicite,
              il hérite du champagne du `<main>` et ressort blanc — un soleil
              délavé au lieu de la signature. Ailleurs il sert de décor en fond
              à très faible opacité ; ici il est au premier plan, donc en
              cuivre plein.
            */}
            <EclipseMark
              id="histoire-nom"
              withCorona
              className="mx-auto h-32 w-32 shrink-0 text-cuivre sm:h-40 sm:w-40 lg:mx-0 lg:ml-auto lg:h-48 lg:w-48"
            />
          </div>
        </section>

        {/*
          La suite. Le texte reste dans les 42 % de gauche de `solys-07`, où
          l'image est sombre — 7,12:1 pour le champagne à 70 %. Au-delà
          commencent les baies vitrées.
        */}
        <div className="relative isolate overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 -z-10">
            <Image
              src="/visuels/solys-07.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[50%_25%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.60)_70%,rgba(10,13,18,0.20)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit/60" />
          </div>

          <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
            <div className="mx-auto max-w-7xl">
              <h2 className="font-display text-[28px] font-normal leading-tight text-ivoire sm:text-[36px]">
                La suite s&rsquo;écrit{' '}
                <span className="italic text-cuivre">avec toi.</span>
              </h2>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-champagne/80">
                Sfera&rsquo;Solys continue d&apos;évoluer avec sa communauté.
                Tes retours, tes expériences et tes attentes nous aident à
                faire grandir un espace de rencontre plus sûr et plus
                inclusif.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Ouvrir Ma Sphère
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <Link
                  href="/valeurs"
                  className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-7 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 ${focusRing}`}
                >
                  Découvrir nos valeurs
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
