import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    fallbackUrl: process.env.NEXT_PUBLIC_API_URL_FALLBACK,
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter((key) => key.includes("API")),
  });
}
