"use client";

import { useEffect } from "react";

/**
 * Thin postMessage relay that runs inside the site's preview iframe.
 * Activated by the CMS when the user toggles "Visual Edit" mode.
 * - Adds hover/selected styles to [data-cms-field] elements
 * - Reports clicks back to the CMS parent window
 * - Applies live preview updates sent from the CMS
 */
export default function CmsEditModeListener() {
  useEffect(() => {
    let active = false;
    let styleEl: HTMLStyleElement | null = null;
    let selectedEl: HTMLElement | null = null;

    function injectStyles() {
      styleEl = document.createElement("style");
      styleEl.id = "__cms-edit-styles";
      styleEl.textContent = `
        [data-cms-field] { cursor: pointer !important; }
        [data-cms-field]:hover {
          outline: 2px dashed rgba(99,102,241,0.65) !important;
          outline-offset: 4px !important;
          border-radius: 3px !important;
        }
        [data-cms-field].cms-selected {
          outline: 2px solid #6366f1 !important;
          outline-offset: 4px !important;
          border-radius: 3px !important;
          box-shadow: 0 0 0 5px rgba(99,102,241,0.12) !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    function removeStyles() {
      styleEl?.remove();
      styleEl = null;
    }

    function selectElement(el: HTMLElement) {
      selectedEl?.classList.remove("cms-selected");
      el.classList.add("cms-selected");
      selectedEl = el;

      const sectionEl = el.closest("[data-cms-section-id]") as HTMLElement | null;
      const rect = el.getBoundingClientRect();

      window.parent.postMessage(
        {
          type: "cms-element-selected",
          sectionId: sectionEl?.dataset.cmsSectionId ?? "",
          field: el.dataset.cmsField ?? "",
          fieldLabel: el.dataset.cmsLabel ?? el.dataset.cmsField ?? "",
          value: el.innerHTML,
          rect: {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height,
          },
        },
        "*"
      );
    }

    function handleClick(e: MouseEvent) {
      if (!active) return;
      const el = (e.target as HTMLElement).closest(
        "[data-cms-field]"
      ) as HTMLElement | null;

      if (!el) {
        selectedEl?.classList.remove("cms-selected");
        selectedEl = null;
        window.parent.postMessage({ type: "cms-element-deselected" }, "*");
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      selectElement(el);
    }

    function handleMessage(e: MessageEvent) {
      if (!e.data?.type) return;
      const { type, sectionId, field, value, style } = e.data;

      if (type === "cms-editmode-enter") {
        active = true;
        injectStyles();
        return;
      }

      if (type === "cms-editmode-exit") {
        active = false;
        removeStyles();
        selectedEl?.classList.remove("cms-selected");
        selectedEl = null;
        return;
      }

      if (type === "cms-field-preview") {
        const el = document.querySelector(
          `[data-cms-section-id="${sectionId}"] [data-cms-field="${field}"]`
        ) as HTMLElement | null;
        if (!el) return;
        if (value !== undefined) el.innerHTML = value;
        if (style && typeof style === "object") {
          Object.assign(el.style, style);
        }
      }
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("message", handleMessage);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("message", handleMessage);
      removeStyles();
    };
  }, []);

  return null;
}
