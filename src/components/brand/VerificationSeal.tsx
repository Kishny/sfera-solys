// src/components/brand/VerificationSeal.tsx

/**
 * Sceau de vérification — illustration du hero de l'accueil.
 *
 * Remplace l'éclipse glossy de l'ancienne home. Reprend le tracé de la
 * maquette DirA-Home du canvas : deux anneaux (un plein vulcanico, un
 * pointillé lime) et une coche épaisse en crème.
 *
 * Sorti de page.tsx pour être réutilisable (page /commencer, /faq, e-mails
 * de confirmation de vérification…). Décoratif au sens strict, mais il
 * porte du sens ici, d'où le `role="img"` et le libellé.
 */
export default function VerificationSeal({
  className = 'h-[150px] w-[150px] sm:h-[190px] sm:w-[190px] lg:h-[220px] lg:w-[220px]',
}: {
  className?: string;
}) {
  return (
    <svg
      width="220"
      height="220"
      viewBox="0 0 220 220"
      fill="none"
      className={className}
      role="img"
      aria-label="Sceau de vérification Sfera'Solys"
    >
      <circle cx="110" cy="110" r="96" stroke="rgba(234,217,189,0.15)" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="76" stroke="#BD9365" strokeWidth="2" />
      <circle
        cx="110"
        cy="110"
        r="76"
        stroke="#83B28C"
        strokeWidth="2"
        strokeDasharray="4 10"
      />
      <path
        d="M72 114 L98 140 L150 82"
        stroke="#EAD9BD"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
