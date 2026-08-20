import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export const { auth } = NextAuth(authConfig);

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  
  // Skip intl for admin routes
  if (isAdminRoute) {
    return; // Let Auth.js callbacks in auth.config.ts handle redirects for /admin
  }

  // Use next-intl for all other routes
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
