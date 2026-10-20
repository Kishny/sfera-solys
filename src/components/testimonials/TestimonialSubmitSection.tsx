"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquarePlus } from "lucide-react";
import TestimonialForm, { TestimonialFormInitial } from "./TestimonialForm";

/**
 * Section « Partager mon expérience » (session-aware).
 *
 * - Visiteur non connecté : le bouton mène à la connexion.
 * - Membre connecté : le bouton révèle le formulaire partagé, pré-rempli
 *   s'il a déjà témoigné (modification).
 *
 * Sa documentation annonçait un second usage sur /valeurs en variante
 * claire. /valeurs ne l'importe pas : /temoignages est le seul appelant, et
 * il passait "dark". La variante claire a été retirée.
 *
 * `libelle` existe pour la maquette de /temoignages, qui titre son bouton
 * « Envie d'écrire le tien ? ». Il ne s'applique qu'au **premier** dépôt :
 * un membre qui a déjà témoigné lit « Modifier mon témoignage », parce que
 * c'est ce que le bouton fait réellement — la maquette ne dessine pas ce
 * cas, et lui donner le même libellé mentirait sur l'action.
 */
export default function TestimonialSubmitSection({
  libelle = "Partager mon expérience",
}: {
  libelle?: string;
}) {
  const { data: session, status } = useSession();
  const sessionUser = session?.user as { id?: string } | undefined;

  const [open, setOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [initial, setInitial] = useState<TestimonialFormInitial | undefined>();
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/users/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.user?.image) setProfileImage(d.user.image);
      })
      .catch(() => {});

    fetch("/api/testimonials/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.testimonial) {
          setAlreadySubmitted(true);
          setInitial({
            content: d.testimonial.content,
            age: d.testimonial.age,
            city: d.testimonial.city,
            rating: d.testimonial.rating,
            showAvatar: d.testimonial.showAvatar,
          });
        }
      })
      .catch(() => {});
  }, [status]);

  /** Le bouton cuivré de la maquette, partagé par les deux états fermés. */
  const classesBouton =
    "inline-flex items-center justify-center gap-2 rounded-xl bg-degrade-cuivre px-6 py-3 text-sm font-bold text-nuit transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cuivre/70 focus-visible:ring-offset-2 focus-visible:ring-offset-nuit";

  if (status === "loading") return null;

  if (!sessionUser?.id) {
    return (
      <div>
        <Link href="/auth?mode=login" className={classesBouton}>
          {libelle}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>

        <p className="mt-3 text-[12.5px] text-champagne/70">
          Connexion requise pour laisser un témoignage.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={classesBouton}
      >
        {alreadySubmitted ? (
          <>
            <MessageSquarePlus size={16} aria-hidden="true" />
            Modifier mon témoignage
          </>
        ) : (
          <>
            {libelle}
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <TestimonialForm
        profileImage={profileImage}
        initial={initial}
        onCancel={() => setOpen(false)}
      />
    </motion.div>
  );
}
