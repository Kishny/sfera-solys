// src/app/temoignages/page.tsx

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PublicTestimonial } from "@/components/testimonials/TestimonialCard";
import TestimonialsExplorer from "@/components/testimonials/TestimonialsExplorer";
import TestimonialSubmitSection from "@/components/testimonials/TestimonialSubmitSection";
import { buildMeta } from "@/app/layout-meta";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/models/Testimonial";

/**
 * Page Témoignages Sfera'Solys — direction A (« dossier de vérification »).
 *
 * Restructuration + rebranding (voir CLAUDE.md § Restructuration) :
 * cette page n'avait jamais été rebrandée. Corrigés ici, parce que c'était
 * visible par les moteurs de recherche autant que par les visiteurs :
 * - le titre SEO annonçait « Elles parlent de » l'ancienne marque, et la
 *   description parlait de femmes ;
 * - les données structurées (JSON-LD) déclaraient à Google le nom et la
 *   description de l'ancienne plateforme ;
 * - l'URL canonique de repli pointait vers le domaine de l'ancien site.
 *
 * Le fond de la page passe en sombre : les composants de témoignages
 * (explorateur, carte, note en étoiles, formulaire) reçoivent désormais
 * une prop `variant` et sont appelés ici en "dark". Leur valeur par défaut
 * reste "light", donc /valeurs et /circle ne bougent pas.
 */

export const metadata = buildMeta(
  "Témoignages — ils parlent de Sfera'Solys",
  "Découvre les témoignages des membres de Sfera'Solys : des hommes vérifiés qui ont trouvé des rencontres sincères, dans un cadre sûr.",
  "/temoignages"
);

// Revalidation toutes les 5 minutes (les témoignages changent peu).
export const revalidate = 300;

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://sferasolys.com"
).replace(/\/$/, "");

/**
 * Récupère les témoignages approuvés directement en base (rendu serveur),
 * pour un bon référencement (contenu présent dans le HTML).
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

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss";

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

  // JSON-LD : Organisation + note moyenne + avis (SEO "rich results").
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sfera'Solys",
    url: baseUrl,
    description:
      "Site de rencontre premium français réservé aux hommes de 28 ans et plus, avec vérification d'identité manuelle.",
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
      author: {
        "@type": "Person",
        name: t.authorName,
      },
      reviewBody: t.content,
      ...(t.createdAt ? { datePublished: t.createdAt.slice(0, 10) } : {}),
    })),
  };

  return (
    <>
      <Header />
      <JsonLd data={jsonLd} />

      <main id="contenu" className="bg-abyss text-cream">
        {/* Hero */}
        <section className="border-b border-cream/8 px-4 pt-20 sm:px-6 sm:pt-24 lg:px-16 xl:pt-28">
          <div className="mx-auto max-w-3xl py-12 text-center sm:py-16">
            <span className="inline-block rounded-full border border-orange/35 bg-orange/[0.12] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-cream">
              Paroles de membres vérifiés
            </span>

            <h1 className="font-display [font-stretch:125%] mt-5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-cream sm:text-[40px]">
              Ils parlent de Sfera&apos;Solys.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-cream/60 sm:text-base">
              Chaque témoignage vient d&apos;un compte dont l&apos;identité a
              été vérifiée. Pas d&apos;avis achetés, pas de profils
              inventés — ce que vivent réellement les membres, avant même que
              tu t&apos;inscrives.
            </p>

            {avgRating && count > 0 && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-cream/10 bg-[#0C222D] px-4 py-2 text-sm">
                <Star size={15} className="text-orange" fill="currentColor" />
                <span className="font-bold text-cream">{avgRating}/5</span>
                <span className="text-cream/55">
                  · {count} témoignage{count > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Grille de témoignages */}
        <section className="border-b border-cream/8 px-4 py-12 sm:px-6 sm:py-16 lg:px-16">
          <div className="mx-auto max-w-7xl">
            {count > 0 ? (
              <TestimonialsExplorer
                testimonials={testimonials}
                pageSize={12}
                variant="dark"
              />
            ) : (
              <div className="mx-auto max-w-xl rounded-3xl border border-dashed border-cream/15 bg-[#0C222D] px-4 py-10 text-center">
                <p className="text-base font-semibold text-cream">
                  Les premiers témoignages arrivent bientôt
                </p>
                <p className="mt-1.5 text-sm text-cream/55">
                  Sois parmi les premiers à partager ton expérience.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Partager son expérience */}
        <section className="border-b border-cream/8 px-4 py-14 sm:px-6 sm:py-20 lg:px-16">
          <div className="mx-auto max-w-3xl rounded-3xl border border-cream/8 bg-[#0C222D] p-6 sm:p-9">
            <div className="text-center">
              <h2 className="font-display [font-stretch:125%] text-xl font-extrabold tracking-tight text-cream sm:text-2xl">
                Tu fais partie de l&apos;aventure ?
              </h2>
              <p className="mt-1.5 text-sm text-cream/60">
                Partage ton expérience pour aider les prochains à se lancer.
              </p>
            </div>

            <TestimonialSubmitSection variant="dark" />
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 py-12 sm:px-6 sm:py-14 lg:px-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 rounded-3xl border border-orange/25 bg-[#0C222D] p-7 text-center sm:p-11 lg:flex-row lg:text-left">
            <div>
              <h2 className="font-display [font-stretch:125%] mb-1.5 text-xl font-extrabold text-cream sm:text-2xl">
                Envie d&apos;écrire le tien ?
              </h2>
              <p className="text-sm text-cream/60">
                Constitution du dossier gratuite, vérification immédiate.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-3 sm:flex-row">
              <Link
                href="/auth?mode=register"
                className={`fx-btn rounded-xl bg-orange px-7 py-3.5 text-sm font-bold text-abyss transition-colors hover:bg-orange/90 ${focusRing}`}
              >
                constituer mon dossier
              </Link>

              <Link
                href="/commencer"
                className={`fx-link inline-flex items-center gap-1.5 text-[13px] font-semibold text-orange transition-colors hover:text-orange/80 ${focusRing}`}
              >
                voir comment ça marche
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
