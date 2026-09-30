// src/app/layout.tsx

import type { Metadata } from "next";

// En premier : le contrôle doit parler avant que next-auth ne lève.
import { URL_SITE, verifierNextAuthUrl } from "@/lib/configuration";
import AnalytiqueConsentie from "@/components/AnalytiqueConsentie";

import "./globals.css";
import { archivo, fraunces, instrumentSans } from "./fonts";

import ClientProvider from "./ClientProvider";
import JsonLd from "@/components/JsonLd";
import CookieConsent from "@/components/CookieConsent";

/**
 * URL publique du site.
 *
 * En production, mets bien dans ton .env :
 * NEXT_PUBLIC_APP_URL=https://sferasolys.fr
 */
verifierNextAuthUrl();

const baseUrl = URL_SITE;

/**
 * Métadonnées globales du site.
 *
 * Les pages peuvent ensuite surcharger ces données
 * avec le helper buildMeta dans src/app/layout-meta.ts.
 */
export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),

  title: {
    default: "Sfera'Solys — Site de rencontres premium pour hommes",
    template: "%s | Sfera'Solys",
  },

  description:
    "Sfera'Solys est le site de rencontres premium pensé pour les hommes français. Sécurité, authenticité et affinités profondes. Rejoignez une communauté bienveillante.",

  keywords: [
    "site de rencontres",
    "rencontres hommes",
    "site de rencontres premium",
    "rencontres authentiques",
    "Sfera'Solys",
    "rencontres sécurisées",
    "rencontres sérieuses",
    "rencontres France",
  ],

  authors: [{ name: "Sfera'Solys", url: baseUrl }],
  creator: "Sfera'Solys",
  publisher: "Sfera'Solys",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },

  manifest: "/site.webmanifest",

  openGraph: {
    title: "Sfera'Solys — Site de rencontres premium pour hommes",
    description:
      "Sfera'Solys est le site de rencontres premium pensé pour les hommes français. Sécurité, authenticité et affinités profondes.",
    url: baseUrl,
    siteName: "Sfera'Solys",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sfera'Solys — Site de rencontres premium",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Sfera'Solys — Site de rencontres premium pour hommes",
    description:
      "Rejoignez Sfera'Solys, la communauté de rencontres premium pensée pour les hommes français.",
    images: ["/og-image.png"],
    creator: "@sferasolys",
  },

  alternates: {
    canonical: baseUrl,
    languages: {
      "fr-FR": baseUrl,
    },
  },

  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
  },

  category: "dating",
};

/**
 * JSON-LD Organization.
 *
 * Sert à améliorer la compréhension du site par Google.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Sfera'Solys",
  url: baseUrl,
  logo: `${baseUrl}/logo-icon-512.png`,
  description:
    "Site de rencontres premium pensé pour les hommes français. Sécurité, authenticité et affinités profondes.",
  foundingDate: "2026",
  address: {
    "@type": "PostalAddress",
    addressCountry: "FR",
  },
  sameAs: [],
};

/**
 * JSON-LD WebSite.
 */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sfera'Solys",
  url: baseUrl,
  description: "Site de rencontres premium pour hommes — France",
  inLanguage: "fr-FR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/explorer?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/**
 * Layout racine obligatoire de Next.js.
 *
 * Important :
 * - src/app/layout.tsx doit toujours exporter un composant React par défaut.
 * - C'est ici qu'on met <html>, <body>, providers globaux, fonts, etc.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
      </head>

      <body
        className={`${archivo.variable} ${fraunces.variable} ${instrumentSans.variable} font-sans antialiased`}
      >
        <ClientProvider>{children}</ClientProvider>
        <CookieConsent />
        <AnalytiqueConsentie />
      </body>
    </html>
  );
}