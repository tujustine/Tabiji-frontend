"use client";

import Link from "next/link";

const heroBackground = {
  backgroundColor: "#161a17",
  backgroundImage: [
    "linear-gradient(to top, rgb(246 230 209) 0%, rgb(246 230 209 / 0.88) 12%, rgb(246 230 209 / 0.35) 35%, rgb(246 230 209 / 0.08) 55%, transparent 72%)",
    "radial-gradient(ellipse 85% 50% at 50% 8%, rgb(122 132 80 / 0.14) 0%, transparent 52%)",
    "linear-gradient(158deg, #0f1210 0%, #171c19 22%, #1f2621 48%, #283028 72%, #2f3830 100%)",
  ].join(", "),
} as const;

/** Contenu décalé sous le header fixe (plein écran : pas de MainShell pt sur /) */
export default function HeroSection() {
  return (
    <section className="relative flex min-h-[85vh] flex-col overflow-hidden">
      <div
        className="absolute inset-0 -z-0"
        style={heroBackground}
        aria-hidden
      />
      <div className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-16 pt-24 text-center sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="font-bagel text-5xl font-semibold tracking-tight text-[#f6e6d1] md:text-7xl">
            Tabiji
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg font-medium text-[#f6e6d1]/90 md:text-xl">
            Carnet de voyage et itinéraires, au même endroit.
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#f6e6d1]/70 md:text-lg">
            Organisez vos déplacements, gardez photos et repères, puis partagez ce
            qui compte — sans vous disperser entre plusieurs outils.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href="/user/signup"
              className="inline-flex min-w-[200px] items-center justify-center rounded-lg bg-[#7a8450] px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-[#6a7450] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6e6d1]"
            >
              Créer un compte
            </Link>
            <Link
              href="/user/login"
              className="inline-flex min-w-[200px] items-center justify-center rounded-lg border border-[#f6e6d1]/35 bg-transparent px-7 py-3 text-base font-semibold text-[#f6e6d1] transition-colors hover:border-[#f6e6d1]/55 hover:bg-[#f6e6d1]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f6e6d1]"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
