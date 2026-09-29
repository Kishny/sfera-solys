import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dossier de build, surchargeable par `NEXT_DIST_DIR`.
   *
   * `next dev` et `next build` écrivent tous les deux dans `.next`. Lancer une
   * vérification de build pendant que le serveur de développement tourne écrase
   * les chunks qu'il est en train de servir : la page se fige sur son écran de
   * chargement et la console affiche un `SyntaxError` dans `layout.js` — le
   * bundle servi n'est plus celui que le navigateur attend. Le code n'y est
   * pour rien, c'est le dossier qui a été piétiné.
   *
   * Un build de vérification se lance donc ainsi :
   *
   *     NEXT_DIST_DIR=.next-verif npx next build
   *
   * et laisse `.next` au serveur de développement.
   */
  distDir: process.env.NEXT_DIST_DIR || ".next",

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      // Avatars Google OAuth
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Cloudinary (upload avatars)
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  /**
   * `/vibementor` est devenu `/entraide` : la fonctionnalité était un forum
   * d'entraide entre membres, pas du coaching (voir CLAUDE.md). Une redirection
   * permanente évite de casser les liens déjà partagés, les favoris et le
   * référencement de l'ancienne URL.
   */
  async redirects() {
    return [{ source: "/vibementor", destination: "/entraide", permanent: true }];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              /*
               * `va.vercel-scripts.com` : la mesure d'audience Vercel est
               * montée après consentement (`AnalytiqueConsentie`), mais la CSP
               * ne l'autorisait pas — son script était bloqué et deux erreurs
               * s'affichaient dans la console à chaque page. Une mesure
               * annoncée, consentie, et qui ne mesurait rien.
               */
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://accounts.google.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
              "connect-src 'self' https://api.stripe.com wss://ws-eu.pusher.com https://sockjs-eu.pusher.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://www.youtube-nocookie.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
