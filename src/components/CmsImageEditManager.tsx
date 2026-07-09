"use client";

import { useCmsPreviewContext } from "../contexts/CmsPreviewContext";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TrackedImage {
  el: HTMLImageElement;
  parent: HTMLElement;
  sectionId: string;
  fieldName: string;
}

/**
 * Mounted once at the app root. Scans the DOM for any <img data-cms-field="...">
 * inside a section tagged with data-cms-section-id (stamped by EditableSection)
 * and overlays a "Change image" affordance on it — no per-image wiring needed
 * in individual components beyond a single data attribute on the <Image> tag.
 *
 * The overlay is portaled into the image's OWN parent element (which must be
 * position:relative — the same convention every image wrapper already uses)
 * and positioned with plain CSS `absolute inset-0`, not JS-computed
 * coordinates. That's deliberate: an earlier version used
 * getBoundingClientRect() + scroll/resize listeners to position a
 * document.body portal, which visibly lagged the real image during scroll
 * (JS re-renders can't keep up with the browser's native scroll compositing).
 * Rendering as a true sibling in the image's own layout box scrolls in
 * lockstep with zero JS involved.
 */
export default function CmsImageEditManager() {
  const { editMode, updateImage, sectionSaveState, saveSection } = useCmsPreviewContext();
  const [images, setImages] = useState<TrackedImage[]>([]);
  // Which specific `${sectionId}:${fieldName}` images were actually changed —
  // gates the per-image Save chip so it only appears under the image that
  // was edited, not every image sharing that image's section-wide save state.
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTargetRef = useRef<{
    sectionId: string;
    fieldName: string;
    currentAlt?: string;
  } | null>(null);

  // Render-time state adjustment per react.dev/learn/you-might-not-need-an-effect.
  // Once a section's save state clears (saved), drop the dirty flag for any
  // image field that belonged to it so a future edit starts clean.
  const [prevSectionSaveState, setPrevSectionSaveState] = useState(sectionSaveState);
  if (sectionSaveState !== prevSectionSaveState) {
    setPrevSectionSaveState(sectionSaveState);
    setDirtyFields((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        const sectionId = key.slice(0, key.indexOf(":"));
        if (sectionSaveState[sectionId] === undefined) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }

  useEffect(() => {
    // While not in edit mode the component renders null regardless of what's
    // in `images`, so there's nothing to synchronize — just skip setup.
    if (!editMode) return;

    const scan = () => {
      const found: TrackedImage[] = [];
      document
        .querySelectorAll<HTMLImageElement>("img[data-cms-field]")
        .forEach((el) => {
          const fieldName = el.getAttribute("data-cms-field");
          const sectionEl = el.closest<HTMLElement>("[data-cms-section-id]");
          const sectionId = sectionEl?.getAttribute("data-cms-section-id");
          if (fieldName && sectionId && el.parentElement) {
            found.push({ el, parent: el.parentElement, sectionId, fieldName });
          }
        });
      setImages(found);
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-cms-field", "src"],
    });

    return () => observer.disconnect();
  }, [editMode]);

  if (!editMode || typeof document === "undefined") return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = pendingTargetRef.current;
    pendingTargetRef.current = null;
    if (!file || !target) return;
    setDirtyFields((prev) => ({ ...prev, [`${target.sectionId}:${target.fieldName}`]: true }));
    updateImage(target.sectionId, target.fieldName, file, target.currentAlt);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {images.map(({ el, parent, sectionId, fieldName }) => {
        const saveState = sectionSaveState[sectionId];
        const saving = saveState === "saving";
        const isDirty = dirtyFields[`${sectionId}:${fieldName}`] === true;

        return createPortal(
          <div key={`${sectionId}:${fieldName}`} className="pointer-events-none absolute inset-0 z-40">
            <button
              type="button"
              aria-label="Change image"
              style={{ pointerEvents: "auto" }}
              className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 outline-2 outline-dashed outline-offset-[-2px] outline-[#00FFD2] transition hover:bg-black/40 hover:opacity-100"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                pendingTargetRef.current = {
                  sectionId,
                  fieldName,
                  currentAlt: el.alt,
                };
                fileInputRef.current?.click();
              }}
            >
              <span className="flex items-center gap-1.5 rounded-full bg-[#00FFD2] px-3 py-1.5 text-xs font-semibold text-[#061665] shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
                Change image
              </span>
            </button>
            {saveState && isDirty && (
              <button
                type="button"
                aria-label={saving ? "Saving…" : "Save this section"}
                disabled={saving}
                style={{ pointerEvents: "auto" }}
                className="absolute top-full left-0 mt-1.5 flex items-center gap-1.5 rounded-full bg-[#00FFD2] px-3 py-1.5 text-xs font-semibold text-[#061665] shadow-lg transition hover:brightness-95 disabled:cursor-wait disabled:opacity-80"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  saveSection(sectionId);
                }}
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
              </button>
            )}
          </div>,
          parent,
        );
      })}
    </>
  );
}
