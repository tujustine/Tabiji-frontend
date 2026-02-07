"use client";

import dynamic from "next/dynamic";

const FooterClient = dynamic(() => import("./FooterClient"), {
  ssr: false,
});

export default function Footer() {
  return <FooterClient />;
}
