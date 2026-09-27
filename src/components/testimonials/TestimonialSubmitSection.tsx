"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import TestimonialForm, { TestimonialFormInitial } from "./TestimonialForm";

/**
 * Section "Partager mon expérience" (session-aware).
 *
 * - Visiteur non connecté : invitation à se connecter.
 * - Membre connecté : bouton qui révèle le formulaire partagé, pré-rempli
 *   s'il a déjà témoigné (modification).
 *
 * Réutilisée sur /valeurs (variante claire) et /temoignages (variante
 * sombre). `variant` vaut "light" par défaut pour ne rien casser sur les
 * pages pas encore migrées vers l'identité sombre.
 */
export default function TestimonialSubmitSection({
  variant = "light",
}: {
  variant?: "light" | "dark";
}) {
  const { data: session, status } = useSession();
  const isDark = variant === "dark";
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

  if (status === "loading") return null;

  if (!sessionUser?.id) {
    return (
      <p
        className={
          isDark
            ? "mt-4 text-center text-xs text-cream/55 sm:mt-6 sm:text-sm"
            : "mt-4 text-center text-xs text-[#999] sm:mt-6 sm:text-sm"
        }
      >
        <Link
          href="/auth?mode=login"
          className={
            isDark
              ? "font-semibold text-orange underline underline-offset-2 hover:text-orange/80"
              : "text-[#8E7AB5] underline underline-offset-2 hover:text-[#5B4B8A]"
          }
        >
          Connecte-toi
        </Link>{" "}
        pour partager ton expérience.
      </p>
    );
  }

  return (
    <div className="mx-auto mt-5 max-w-2xl sm:mt-8">
      {!open ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={
              isDark
                ? "inline-flex items-center gap-2 rounded-xl border border-cream/15 px-5 py-2.5 text-sm font-semibold text-cream/85 transition-colors hover:border-orange/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange/70 focus-visible:ring-offset-2 focus-visible:ring-offset-abyss sm:px-6 sm:py-3"
                : "inline-flex items-center gap-2 rounded-full border border-[#E8E0FF] bg-white px-5 py-2.5 text-sm font-medium text-[#5B4B8A] transition-all hover:border-[#8E7AB5] hover:shadow-md sm:px-6 sm:py-3"
            }
          >
            <MessageSquarePlus size={16} />
            {alreadySubmitted ? "Modifier mon témoignage" : "Partager mon expérience"}
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TestimonialForm
            profileImage={profileImage}
            initial={initial}
            variant={variant}
            onCancel={() => setOpen(false)}
          />
        </motion.div>
      )}
    </div>
  );
}
