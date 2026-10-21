// src/app/temoignages/page.tsx

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, Lock, Quote, ShieldCheck, Star } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {
  Surtitre,
  TuileIcone,
  focusRing,
  premierBloc,
  sectionY,
  type IconeMarque,
} from "@/components/brand/mise-en-page";
import { PublicTestimonial } from "@/components/testimonials/TestimonialCard";
import TestimonialsExplorer from "@/components/testimonials/TestimonialsExplorer";
import TestimonialSubmitSection from "@/components/testimonials/TestimonialSubmitSection";
import { buildMeta } from "@/app/layout-meta";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/models/Testimonial";
import { URL_SITE } from "@/lib/configuration";

/**
 * Page Témoignages — direction « nuit cuivrée », d'après la maquette.
 *
 * ## Ce qui est conservé
 *
 * C'est un composant **serveur** : il lit la base, expose `metadata` et
 * émet le JSON-LD des avis. Rien de tout cela ne bouge — la refonte ne
 * touche que la composition. Les deux îlots clients restent les mêmes
 * (`TestimonialsExplorer` pour la grille, `TestimonialSubmitSection` pour
 * le dépôt d'un témoignage).
 *
 * ## La page a deux états, la maquette n'en dessine qu'un
 *
 * La maquette montre le site **vide** : « Les premiers témoignages
 * arrivent bientôt. » C'est l'état réel aujourd'hui, et c'est celui qui
 * est rendu tant que `Testimonial.find({ status: "approved" })` ne
 * remonte rien.
 *
 * Mais la page doit survivre au premier témoignage approuvé. Le bandeau
 * photographique de l'attente laisse alors place à la grille, et
 * l'accroche du héros change — « Découvre bientôt les parcours » devient
 * faux dès qu'il y a quelque chose à lire. Les deux textes sont écrits
 * côte à côte ci-dessous plutôt que l'un à la place de l'autre : c'est la
 * seule façon qu'ils ne divergent pas.
 *
 * ## Un écart avec la maquette, et pourquoi
 *
 * La maquette écrit : « Les témoignages publiés proviennent de vrais
 * membres ayant vérifié leur compte » et « Seuls les membres vérifiés
 * peuvent partager un témoignage ».
 *
 * `POST /api/testimonials` n'exige que `session.user.id` — une connexion.
 * `identityVerified` n'y est jamais lu. La promesse serait donc fausse
 * telle quelle. Ce qui est vrai, et qui est écrit à la place : le
 * témoignage est rattaché au compte de son auteur, il n'y en a qu'un par
 * membre, et il repasse en relecture (`status: "pending"`) à chaque
 * modification.
 *
 * Rendre la phrase de la maquette vraie demande une ligne dans la route :
 * refuser le dépôt si `identityVerified !== true`. C'est une décision
 * produit — elle fermerait le témoignage aux membres non vérifiés — et
 * elle n'a pas été prise ici.
 *
 * ## Les voiles, mesurés sur les images
 *
 * - Héros, sous `lg` : la photographie passe derrière le texte. Voile
 *   vertical 95 % au milieu, 85 % en haut — `solys-05` est semée de
 *   bougies et d'une skyline claire, et le surtitre à 60 % n'y tient que
 *   3,14:1 avec le voile habituel. Au-dessus de `lg`, l'image se range à
 *   droite et le texte retrouve le fond `nuit` plein.
 * - Panneau d'attente : fond voilé à 60 %, panneau à 92 %. Le champagne à
 *   60 % y tient 5,42:1.
 * - Appel à l'action : voile de 92 % à gauche, 20 % à droite. Le texte
 *   reste dans les 42 % de gauche de `solys-07`, où l'image est sombre —
 *   au-delà commencent les baies vitrées, et le même voile n'y tiendrait
 *   plus que 2,52.
 */

export const metadata = buildMeta(
  "Témoignages — ils parlent de Sfera'Solys",
  "Découvre les témoignages des membres de Sfera'Solys : des hommes vérifiés qui ont trouvé des rencontres sincères, dans un cadre sûr.",
  "/temoignages"
);

// Revalidation toutes les 5 minutes (les témoignages changent peu).
export const revalidate = 300;

const baseUrl = URL_SITE.replace(/\/$/, "");

/**
 * Récupère les témoignages approuvés directement en base (rendu serveur),
 * pour un bon référencement : le contenu est présent dans le HTML.
 */
async function getApprovedTestimonials(): Promise<PublicTestimonial[]> {
  try {
    await connectDB();

    const docs = await Testimonial.find({ status: "approved" })
      .sort({ featured: -1, createdAt: -1 })
      .limit(300)
      .select(
        "authorName age city content rating avatar showAvatar featured createdAt"
      )
      .lean();

    return docs.map((t: any) => ({
      _id: String(t._id),
      authorName: t.authorName,
      age: t.age,
      city: t.city,
      content: t.content,
      rating: t.rating ?? 5,
      avatar: t.showAvatar ? t.avatar || null : null,
      featured: Boolean(t.featured),
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : undefined,
    }));
  } catch (error) {
    console.error("[/temoignages] getApprovedTestimonials", error);
    return [];
  }
}

/**
 * Les trois garanties de la colonne « Notre engagement ».
 *
 * Chacune décrit un comportement du code, pas une intention :
 * - le témoignage porte un `userId` et l'upsert est fait sur cette clé,
 *   donc un par membre ;
 * - `showAvatar` conditionne l'exposition de l'avatar, `authorName` et
 *   `city` ont des valeurs de repli mais restent modifiables ;
 * - le `status` repasse à `pending` à chaque dépôt comme à chaque
 *   modification.
 */
const engagements: Array<{
  icon: IconeMarque;
  titre: string;
  description: string;
}> = [
  {
    icon: ShieldCheck,
    titre: "Un témoignage par compte",
    description:
      "Chaque texte est rattaché au compte de son auteur, et relu avant publication — y compris après chaque modification.",
  },
  {
    icon: Lock,
    titre: "Respect de la confidentialité",
    description:
      "Chacun choisit le nom affiché, son âge et sa ville. La photo de profil n'apparaît que si le membre la demande.",
  },
  {
    icon: Heart,
    titre: "Des histoires diverses",
    description:
      "Des parcours, des rencontres et des expériences uniques, racontés à leur rythme.",
  },
];

export default async function TemoignagesPage() {
  const testimonials = await getApprovedTestimonials();

  const count = testimonials.length;
  const avgRating =
    count > 0
      ? Math.round(
          (testimonials.reduce((sum, t) => sum + (t.rating || 5), 0) / count) *
            10
        ) / 10
      : null;

  // JSON-LD : Organisation + note moyenne + avis (SEO « rich results »).
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sfera'Solys",
    url: baseUrl,
    description:
      "Site de rencontre premium français réservé aux hommes de 28 ans et plus, avec vérification d'identité.",
    ...(avgRating && count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    review: testimonials.slice(0, 20).map((t) => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: t.rating || 5,
        bestRating: 5,
        worstRating: 1,
      },
      author: { "@type": "Person", name: t.authorName },
      reviewBody: t.content,
      ...(t.createdAt ? { datePublished: t.createdAt.slice(0, 10) } : {}),
    })),
  };

  return (
    <>
      <Header />
      <JsonLd data={jsonLd} />

      <main id="contenu" className="bg-nuit text-champagne">
        {/* Héros */}
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-16">
          <div className="absolute inset-0 -z-20 lg:left-[38%]">
            <Image
              src="/visuels/solys-05.webp"
              alt="Quatre hommes en conversation sur une terrasse éclairée à la bougie, la ville en contrebas."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="object-cover object-center"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/95 to-nuit/85 lg:bg-gradient-to-r lg:from-nuit lg:via-nuit/30 lg:to-transparent"
            />

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-nuit to-transparent"
            />
          </div>

          <div className={`relative mx-auto max-w-7xl pb-14 sm:pb-16 ${premierBloc}`}>
            <div className="max-w-xl">
              <Surtitre>Témoignages</Surtitre>

              <h1 className="font-display mt-6 text-[34px] font-normal leading-[1.08] tracking-tight text-ivoire sm:text-[48px]">
                Des histoires
                <br />
                <span className="italic text-cuivre">à partager.</span>
              </h1>

              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-champagne/80 sm:text-base">
                {count > 0
                  ? "Les parcours de membres qui ont trouvé des rencontres sincères sur Sfera'Solys, racontés par eux."
                  : "Découvre bientôt les parcours de membres qui ont trouvé des rencontres sincères sur Sfera'Solys."}
              </p>

              {avgRating && count > 0 && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-champagne/15 bg-nuit/70 px-4 py-2 text-[13px] backdrop-blur-sm">
                  <Star
                    size={15}
                    aria-hidden="true"
                    className="text-cuivre"
                    fill="currentColor"
                  />
                  <span className="font-bold text-champagne">{avgRating}/5</span>
                  <span className="text-champagne/75">
                    · {count} témoignage{count > 1 ? "s" : ""}
                  </span>
                </p>
              )}

              <Link
                href="/commencer"
                className={`mt-8 inline-flex items-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
              >
                Ouvrir ma sphère
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/*
          Les témoignages, ou l'attente.

          Tant qu'aucun témoignage n'est approuvé, la maquette remplace la
          grille par un bandeau photographique et un panneau centré. Une
          terrasse vide pour un mur vide : `solys-02` est la seule
          photographie du jeu où il n'y a personne.
        */}
        {count > 0 ? (
          <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
            <div className="mx-auto max-w-7xl">
              <TestimonialsExplorer testimonials={testimonials} pageSize={12} />
            </div>
          </section>
        ) : (
          <div className="relative isolate overflow-hidden">
            <div aria-hidden="true" className="absolute inset-0 -z-10">
              <Image
                src="/visuels/solys-02.webp"
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-nuit/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-nuit via-transparent to-nuit" />
            </div>

            <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-16">
              <div className="mx-auto max-w-3xl rounded-3xl border border-champagne/12 bg-nuit/90 px-6 py-12 text-center backdrop-blur-sm sm:px-12 sm:py-14">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cuivre/45 bg-nuit/70"
                >
                  <Quote size={24} className="text-cuivre" fill="currentColor" />
                </span>

                <h2 className="font-display mt-7 text-[26px] font-normal leading-tight text-ivoire sm:text-[32px]">
                  Les premiers témoignages arrivent bientôt.
                </h2>

                <span
                  aria-hidden="true"
                  className="mx-auto mt-7 block h-px w-14 bg-cuivre"
                />

                <p className="mt-6 text-[15px] text-champagne/85">
                  Aucun avis publié pour le moment.
                </p>

                <p className="mx-auto mt-3 max-w-md text-[13px] leading-relaxed text-champagne/70">
                  Nos membres commencent tout juste à partager leurs
                  expériences. Reviens bientôt pour découvrir leurs
                  témoignages.
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Engagement et partage */}
        <section className={`px-4 sm:px-6 lg:px-16 ${sectionY}`}>
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            {/* Notre engagement */}
            <div className="rounded-3xl border border-champagne/12 bg-minuit/80 p-6 sm:p-8">
              <Surtitre>Notre engagement</Surtitre>

              <h2 className="font-display mt-5 text-[26px] font-normal leading-tight text-ivoire sm:text-[30px]">
                Des avis authentiques,
                <br />
                <span className="italic text-cuivre">jamais inventés.</span>
              </h2>

              <p className="mt-5 text-[14px] leading-relaxed text-champagne/80">
                Les témoignages publiés viennent de membres connectés à leur
                compte. Nous n&apos;en écrivons aucun et nous n&apos;en
                achetons aucun. Chaque texte est relu avant d&apos;être
                publié, et personne n&apos;est obligé d&apos;en laisser un.
              </p>

              <ul className="mt-7 space-y-5">
                {engagements.map((item) => (
                  <li key={item.titre} className="flex items-start gap-4">
                    <TuileIcone icon={item.icon} className="h-11 w-11" />

                    <div className="min-w-0">
                      <h3 className="text-[14px] font-semibold text-champagne">
                        {item.titre}
                      </h3>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-champagne/70">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Partage ton expérience */}
            <div className="flex flex-col overflow-hidden rounded-3xl border border-champagne/12 bg-minuit/80">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="/visuels/solys-06.webp"
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className="object-cover object-center"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-minuit"
                />
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <Surtitre>Partage ton expérience</Surtitre>

                <h2 className="font-display mt-5 text-[26px] font-normal leading-tight text-ivoire sm:text-[30px]">
                  Tu fais partie
                  <br />
                  de l&rsquo;aventure&nbsp;?
                </h2>

                <p className="mt-5 text-[14px] leading-relaxed text-champagne/80">
                  Ta voix compte. En partageant ton expérience, tu aides les
                  prochains à savoir à quoi s&apos;attendre. Tu restes libre
                  de ce que tu racontes, et de ce que tu gardes pour toi.
                </p>

                {/*
                  Le dépôt lui-même. Le composant décide de ce qu'il montre :
                  une invitation à se connecter pour un visiteur, le bouton
                  d'ouverture du formulaire pour un membre — et « Modifier mon
                  témoignage » s'il en a déjà laissé un. Le libellé de la
                  maquette ne vaut que pour le premier dépôt.
                */}
                <div className="mt-auto pt-7">
                  <TestimonialSubmitSection libelle="Envie d'écrire le tien ?" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
          Appel à l'action.

          Carte arrondie et photographie à l'intérieur, comme la maquette :
          l'image ne va pas jusqu'aux bords de la page ici, contrairement au
          bandeau de /fonctionnalites.
        */}
        <section className="px-4 pb-14 sm:px-6 sm:pb-16 lg:px-16">
          <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cuivre/25">
            {/*
              Cadrage à 25 % de la hauteur, pas au centre : sur un bandeau
              aussi large, un cadrage centré coupe la tête de l'homme et il
              ne reste qu'une masse sombre. À 25 %, la nuque et l'épaule se
              lisent, et le couchant passe à droite.
            */}
            <Image
              src="/visuels/solys-07.webp"
              alt=""
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="-z-10 object-cover object-[50%_25%]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(10,13,18,0.92)_0%,rgba(10,13,18,0.88)_45%,rgba(10,13,18,0.60)_70%,rgba(10,13,18,0.20)_100%)]"
            />

            <div className="p-8 sm:p-10 lg:p-12">
              <h2 className="font-display max-w-lg text-[28px] font-normal leading-tight text-ivoire sm:text-[34px]">
                Prêt à écrire la suite&nbsp;?
              </h2>

              <p className="mt-4 max-w-md text-[14px] leading-relaxed text-champagne/80">
                Rejoins Sfera&rsquo;Solys et vis des rencontres sincères.
                Peut-être que ton témoignage inspirera d&apos;autres membres.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/commencer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-7 py-3.5 text-sm font-bold text-nuit transition-opacity hover:opacity-90 ${focusRing}`}
                >
                  Ouvrir ma sphère
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <Link
                  href="/histoire"
                  className={`inline-flex items-center justify-center rounded-xl border border-champagne/25 px-7 py-3.5 text-sm font-semibold text-champagne transition-colors hover:border-champagne/50 ${focusRing}`}
                >
                  Découvrir le concept
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
