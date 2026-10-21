// src/app/api/auth/[...nextauth]/route.ts

/**
 * Point d'entrée NextAuth.
 *
 * Ce fichier ne contient plus que ses gestionnaires : un fichier de route
 * Next.js n'a le droit d'exporter que ceux-ci et quelques options de
 * segment. La configuration vit dans `@/lib/auth`.
 */

import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
