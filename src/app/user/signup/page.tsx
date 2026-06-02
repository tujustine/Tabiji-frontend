import SignupClient from "@/components/auth/SignupClient";
import TravelLoader from "@/components/ui/TravelLoader";
import { Suspense } from "react";

export default function Signup() {
  return (
    <Suspense fallback={<TravelLoader fullScreen label="Chargement..." />}>
      <SignupClient />
    </Suspense>
  );
}
