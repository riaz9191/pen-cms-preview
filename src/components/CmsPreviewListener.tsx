"use client";

import { useCmsPreviewContext } from "../contexts/CmsPreviewContext";
import { useEffect } from "react";

export default function CmsPreviewListener() {
  const {
    setPreviewSections,
    setEditMode,
    markSectionSaved,
    markSectionSaveError,
    markAllSaved,
  } = useCmsPreviewContext();

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.data || typeof event.data.type !== "string") return;

      if (event.data.type === "cms-preview-update") {
        const { sections } = event.data;
        if (Array.isArray(sections)) setPreviewSections(sections);
        return;
      }

      if (event.data.type === "cms-edit-mode") {
        setEditMode(!!event.data.enabled);
        return;
      }

      if (event.data.type === "cms-section-saved") {
        if (event.data.sectionId) markSectionSaved(event.data.sectionId);
        return;
      }

      if (event.data.type === "cms-section-save-error") {
        if (event.data.sectionId) markSectionSaveError(event.data.sectionId);
        return;
      }

      if (event.data.type === "cms-all-saved") {
        markAllSaved();
      }
    };

    window.addEventListener("message", handler);
    window.parent.postMessage({ type: "cms-preview-ready" }, "*");
    return () => window.removeEventListener("message", handler);
  }, [
    setPreviewSections,
    setEditMode,
    markSectionSaved,
    markSectionSaveError,
    markAllSaved,
  ]);

  return null;
}
