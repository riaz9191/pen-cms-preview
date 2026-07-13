"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Small floating "Edit" chip shown on hover above an editable field, so it's
 * obvious the element is editable (and that a click edits it in place). Portal
 * + fixed positioning — like InlineSaveButton — so it never disturbs page
 * layout or GSAP-managed elements. Non-interactive (pointer-events: none): it's
 * a pure affordance; the field itself is what you click to edit.
 */
export default function InlineEditHint({
  anchorRef,
  visible,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  visible: boolean;
}) {
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const anchorEl = anchorRef.current;
    const hint = hintRef.current;
    if (!anchorEl || !hint) return;

    const update = () => {
      const r = anchorEl.getBoundingClientRect();
      hint.style.top = `${r.top - 24}px`;
      hint.style.left = `${r.left}px`;
      hint.style.visibility = "visible";
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(anchorEl);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [visible, anchorRef]);

  if (!visible || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={hintRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        visibility: "hidden",
        zIndex: 9998,
        pointerEvents: "none",
      }}
      className="flex items-center gap-1 rounded-full bg-[#00FFD2] px-2 py-0.5 text-[11px] font-semibold text-[#061665] shadow-md"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      Edit
    </div>,
    document.body,
  );
}
