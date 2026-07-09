
"use client";

import { useCmsPreviewContext } from "../contexts/CmsPreviewContext";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Small floating "Save" tick rendered directly under the field that was just
 * edited inline. Portal + fixed positioning so it never disturbs the page
 * layout (or any GSAP-managed elements) around the field. Positioning is
 * written to the DOM imperatively (no state) so scroll/resize/typing reflows
 * don't trigger React re-renders.
 */
export default function InlineSaveButton({
  anchorRef,
  sectionId,
  visible,
  beforeSave,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  sectionId: string;
  visible: boolean;
  /** Commit any in-progress (still focused) edit before the save is sent. */
  beforeSave?: () => void;
}) {
  const { saveSection, sectionSaveState } = useCmsPreviewContext();
  const saveState = sectionSaveState[sectionId];
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visible) return;
    const anchorEl = anchorRef.current;
    const btn = btnRef.current;
    if (!anchorEl || !btn) return;

    const update = () => {
      const r = anchorEl.getBoundingClientRect();
      btn.style.top = `${r.bottom + 6}px`;
      btn.style.left = `${r.left}px`;
      btn.style.visibility = "visible";
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    // Reposition when the field itself grows/shrinks while typing
    const ro = new ResizeObserver(update);
    ro.observe(anchorEl);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [visible, anchorRef]);

  // `visible` only becomes true from client-side interaction, so the portal
  // never renders during SSR; the document guard is just belt-and-braces.
  if (!visible || typeof document === "undefined") return null;

  const saving = saveState === "saving";

  return createPortal(
    <button
      ref={btnRef}
      type="button"
      aria-label={saving ? "Saving…" : "Save this section"}
      disabled={saving}
      onMouseDown={(e) => {
        // Prevent stealing focus (which would re-trigger blur handlers)
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Commit the current text first if the user is still typing in the
        // field (blur fires its commit handler synchronously).
        beforeSave?.();
        saveSection(sectionId);
      }}
      style={{ position: "fixed", top: 0, left: 0, visibility: "hidden", zIndex: 9999 }}
      className="flex items-center gap-1.5 rounded-full bg-[#00FFD2] px-3 py-1.5 text-xs font-semibold text-[#061665] shadow-lg transition hover:brightness-95 disabled:cursor-wait disabled:opacity-80"
    >
      {saving ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="h-3.5 w-3.5 animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-9-9" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
      {saving ? "Saving…" : "Save"}
    </button>,
    document.body,
  );
}
