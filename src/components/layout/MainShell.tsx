"use client";

import { usePathname } from "next/navigation";

const PATHS_WITHOUT_MAIN_PT = new Set([
  "/",
  "/user/login",
  "/user/signup",
]);

/**
 * Décale le contenu sous le header fixe transparent (`pt-24`), sauf sur les
 * pages en plein écran où l’espacement est géré localement (accueil, auth).
 */
export default function MainShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const skipMainPt = PATHS_WITHOUT_MAIN_PT.has(pathname);

  return (
    <div className={skipMainPt ? undefined : "pt-24"}>{children}</div>
  );
}
