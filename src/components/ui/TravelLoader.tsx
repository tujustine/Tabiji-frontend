interface TravelLoaderProps {
  fullScreen?: boolean;
  label?: string;
  size?: "default" | "compact";
}

export default function TravelLoader({
  fullScreen = false,
  label = "Chargement...",
  size = "default",
}: Readonly<TravelLoaderProps>) {
  const isCompact = size === "compact";
  let wrapperClass = "flex items-center justify-center px-4 py-8";
  if (fullScreen) {
    wrapperClass = "min-h-screen bg-[#f6e6d1] flex items-center justify-center px-4";
  }
  if (isCompact) {
    wrapperClass = "flex h-full w-full items-center justify-center";
  }
  const cardClass = isCompact
    ? "flex items-center justify-center rounded-xl bg-white/70 p-2 shadow-sm ring-1 ring-[#7a8450]/10"
    : "flex items-center justify-center rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-[#7a8450]/10 backdrop-blur";
  const mapClass = isCompact
    ? "relative h-12 w-20 overflow-hidden rounded-xl border border-[#7a8450]/15 bg-[#f6e6d1]/70 shadow-inner"
    : "relative h-24 w-36 overflow-hidden rounded-2xl border border-[#7a8450]/15 bg-[#f6e6d1]/70 shadow-inner";
  const topLineClass = isCompact
    ? "absolute left-0 top-3 h-px w-full rotate-[-12deg] bg-[#7a8450]/10"
    : "absolute left-0 top-5 h-px w-full rotate-[-12deg] bg-[#7a8450]/10";
  const bottomLineClass = isCompact
    ? "absolute bottom-3 left-0 h-px w-full rotate-[10deg] bg-[#7a8450]/10"
    : "absolute bottom-6 left-0 h-px w-full rotate-[10deg] bg-[#7a8450]/10";
  const startPointClass = isCompact
    ? "absolute bottom-2 left-2 h-2 w-2 rounded-full bg-[#7a8450] ring-2 ring-white"
    : "absolute bottom-5 left-5 h-3 w-3 rounded-full bg-[#7a8450] ring-4 ring-white";
  const endPointClass = isCompact
    ? "absolute right-2 top-2 h-2 w-2 rounded-full bg-[#7a8450] ring-2 ring-white"
    : "absolute right-5 top-5 h-3 w-3 rounded-full bg-[#7a8450] ring-4 ring-white";

  return (
    <div className={wrapperClass}>
      <div
        className={cardClass}
        role="status"
        aria-live="polite"
      >
        <div className={mapClass}>
          <div className={topLineClass} />
          <div className={bottomLineClass} />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 144 96"
            aria-hidden="true"
          >
            <path
              d="M 24 68 C 44 24, 74 78, 118 28"
              fill="none"
              stroke="#7a8450"
              strokeWidth="3"
              strokeDasharray="6 7"
              strokeLinecap="round"
              opacity="0.65"
            />
            <g fill="#7a8450">
              <animateMotion
                dur="2.8s"
                repeatCount="indefinite"
                rotate="auto"
                path="M 24 68 C 44 24, 74 78, 118 28"
              />
              <path d="M 18 0 C 14.5 -1.8 10.5 -2.7 5.5 -3 L -1 -13.5 C -1.6 -14.4 -2.9 -14.3 -3.2 -13.2 L -2.2 -3.4 L -10 -2.6 L -13.2 -10.8 L -15.4 -6.4 L -12 -1.2 L -12 1.2 L -15.4 6.4 L -13.2 10.8 L -10 2.6 L -2.2 3.4 L -3.2 13.2 C -2.9 14.3 -1.6 14.4 -1 13.5 L 5.5 3 C 10.5 2.7 14.5 1.8 18 0 Z" />
            </g>
          </svg>
          <div className={startPointClass} />
          <div className={endPointClass} />
        </div>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}
