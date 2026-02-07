/**
 * Tests unitaires pour useScrollLock
 */

import { renderHook } from "@testing-library/react";
import { useScrollLock } from "@/hooks/useScrollLock";

describe("useScrollLock", () => {
  const originalOverflow = document.body.style.overflow;
  const originalPaddingRight = document.body.style.paddingRight;

  afterEach(() => {
    document.body.style.overflow = originalOverflow;
    document.body.style.paddingRight = originalPaddingRight;
  });

  it("devrait verrouiller le scroll quand isLocked est true", () => {
    renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("devrait déverrouiller le scroll au démontage", () => {
    const { unmount } = renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe(originalOverflow);
  });

  it("ne devrait pas modifier le scroll quand isLocked est false", () => {
    document.body.style.overflow = "auto";
    renderHook(() => useScrollLock(false));

    expect(document.body.style.overflow).toBe("auto");
  });
});
