import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes qui nécessitent l'authentification
const protectedRoutes = ["/dashboard", "/profile", "/trips/", "/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si la route nécessite l'authentification
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Vérifier la présence du cookie d'authentification
    const token = request.cookies.get("token")?.value;
    const user = request.cookies.get("user")?.value;

    if (!token || !user) {
      // Rediriger vers la page de connexion
      const loginUrl = new URL("/user/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Optionnel : vérifier si le token est valide côté serveur
    // Pour l'instant, on fait confiance aux cookies
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
