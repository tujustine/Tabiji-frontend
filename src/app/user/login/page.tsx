import LoginClient from "@/components/auth/LoginClient";
import TravelLoader from "@/components/ui/TravelLoader";
import { Suspense } from "react";

export default function Login() {
  return (
    <Suspense fallback={<TravelLoader fullScreen label="Chargement..." />}>
      <LoginClient />
    </Suspense>
  );
}
