"use client";

/** Center point for Bo flight targeting — no visible box. */
export function AuthBoTargetMarker() {
  return (
    <div className="relative flex h-full min-h-[calc(100vh-58px)] w-full items-center justify-center px-4 py-6 lg:px-8">
      <div
        data-auth-bo-target
        className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      />
    </div>
  );
}

export function AuthBoMobileTargetMarker() {
  return (
    <div
      data-auth-bo-mobile-target
      className="pointer-events-none mx-auto mb-8 h-0 w-0 lg:hidden"
      aria-hidden
    />
  );
}
