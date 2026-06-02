function SkeletonBlock({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div
      className={`animate-pulse rounded bg-[#7a8450]/10 ${className}`}
      aria-hidden="true"
    />
  );
}

export function TripCardSkeleton() {
  return (
    <div
      className="w-80 flex-shrink-0 overflow-hidden rounded-lg bg-white shadow-sm"
      aria-hidden="true"
    >
      <SkeletonBlock className="h-48 w-full rounded-none bg-[#7a8450]/15" />
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-5 w-2/3" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function PolaroidSkeleton() {
  return (
    <div
      className="bg-white p-4 shadow-sm"
      aria-hidden="true"
    >
      <SkeletonBlock className="mb-4 aspect-square w-full rounded-none bg-[#7a8450]/15" />
      <div className="space-y-3 pb-2">
        <SkeletonBlock className="mx-auto h-5 w-2/3" />
        <SkeletonBlock className="mx-auto h-4 w-1/2" />
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div
      className="relative h-[400px] w-full overflow-hidden rounded-lg border border-gray-200 bg-[#f6e6d1]/80 shadow-sm"
      aria-hidden="true"
    >
      <div className="absolute inset-0 animate-pulse bg-[#7a8450]/10" />
      <div className="absolute left-0 top-1/4 h-px w-full rotate-[-8deg] bg-white/60" />
      <div className="absolute bottom-1/3 left-0 h-px w-full rotate-[7deg] bg-white/60" />
      <div className="absolute left-1/4 top-1/3 h-4 w-4 rounded-full bg-[#7a8450]/30 ring-4 ring-white/70" />
      <div className="absolute bottom-1/4 right-1/3 h-4 w-4 rounded-full bg-[#7a8450]/30 ring-4 ring-white/70" />
      <div className="absolute right-4 top-4 space-y-2">
        <SkeletonBlock className="h-9 w-20 bg-white/70" />
        <SkeletonBlock className="h-9 w-20 bg-white/70" />
      </div>
    </div>
  );
}
