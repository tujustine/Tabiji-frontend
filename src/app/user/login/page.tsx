import LoginClient from "@/components/auth/LoginClient";
import { Suspense } from "react";

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}
