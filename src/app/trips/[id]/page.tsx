import TripDetailClient from "@/components/trip/TripDetailClient";

interface TripDetailPageProps {
  params:
    | Promise<{
        id: string;
      }>
    | { id: string };
}

export default async function Trip({ params }: TripDetailPageProps) {
  const resolved = params instanceof Promise ? await params : params;
  return <TripDetailClient tripId={resolved.id} />;
}
