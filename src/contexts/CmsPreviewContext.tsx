"use client";

import { createContext, useContext, useState } from "react";

type SectionContent = Record<string, unknown>;
type PreviewMap = Record<string, SectionContent>; // keyed by component_type

type SectionSaveState = "dirty" | "saving" | undefined;

interface CmsPreviewContextValue {
  preview: PreviewMap;
  editMode: boolean;
  sectionSaveState: Record<string, SectionSaveState>;
  setPreviewSections: (
    sections: Array<{
      id: string;
      component_type?: string;
      content: SectionContent;
      is_visible?: boolean;
    }>
  ) => void;
  setEditMode: (enabled: boolean) => void;
  requestEditSection: (sectionId: string) => void;
  updateField: (sectionId: string, fieldName: string, value: unknown) => void;
  updateImage: (
    sectionId: string,
    fieldName: string,
    file: File,
    currentAlt?: string,
  ) => void;
  saveSection: (sectionId: string) => void;
  markSectionSaved: (sectionId: string) => void;
  markSectionSaveError: (sectionId: string) => void;
  markAllSaved: () => void;
}

const CmsPreviewContext = createContext<CmsPreviewContextValue>({
  preview: {},
  editMode: false,
  sectionSaveState: {},
  setPreviewSections: () => {},
  setEditMode: () => {},
  requestEditSection: () => {},
  updateField: () => {},
  updateImage: () => {},
  saveSection: () => {},
  markSectionSaved: () => {},
  markSectionSaveError: () => {},
  markAllSaved: () => {},
});

export function CmsPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preview, setPreview] = useState<PreviewMap>({});
  const [editMode, setEditMode] = useState(false);
  const [sectionSaveState, setSectionSaveState] = useState<
    Record<string, SectionSaveState>
  >({});

  const setPreviewSections: CmsPreviewContextValue["setPreviewSections"] = (
    sections
  ) => {
    const map: PreviewMap = {};
    sections.forEach((s) => {
      if (s.id) map[s.id] = s.content;
    });
    setPreview(map);
  };

  const requestEditSection = (sectionId: string) => {
    window.parent.postMessage({ type: "cms-edit-section", sectionId }, "*");
  };

  const updateField = (sectionId: string, fieldName: string, value: unknown) => {
    setPreview((prev) => ({
      ...prev,
      [sectionId]: { ...(prev[sectionId] || {}), [fieldName]: value },
    }));
    setSectionSaveState((prev) => ({ ...prev, [sectionId]: "dirty" }));
    window.parent.postMessage(
      { type: "cms-field-update", sectionId, fieldName, value },
      "*"
    );
  };

  const updateImage = (
    sectionId: string,
    fieldName: string,
    file: File,
    currentAlt?: string,
  ) => {
    // Instant local preview via an object URL — swapped for the real
    // uploaded URL automatically once the CMS's confirmed content echoes
    // back through setPreviewSections (which replaces this wholesale).
    const objectUrl = URL.createObjectURL(file);
    setPreview((prev) => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldName]: { url: objectUrl, alt: currentAlt || "" },
      },
    }));
    setSectionSaveState((prev) => ({ ...prev, [sectionId]: "dirty" }));
    window.parent.postMessage(
      { type: "cms-image-upload", sectionId, fieldName, file },
      "*"
    );
  };

  const saveSection = (sectionId: string) => {
    setSectionSaveState((prev) => ({ ...prev, [sectionId]: "saving" }));
    // Small delay so a cms-field-update committed in the same click is
    // processed (and React state flushed) by the CMS before the save runs.
    window.setTimeout(() => {
      window.parent.postMessage({ type: "cms-save-section", sectionId }, "*");
    }, 250);
  };

  const markSectionSaved = (sectionId: string) => {
    setSectionSaveState((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
  };

  const markSectionSaveError = (sectionId: string) => {
    setSectionSaveState((prev) => ({ ...prev, [sectionId]: "dirty" }));
  };

  // The CMS's own top-level "Save" button persists the whole page (every
  // section), not just the one the inline tick targets — clear all pending
  // indicators so the preview doesn't get stuck showing a stale Save prompt.
  const markAllSaved = () => {
    setSectionSaveState({});
  };

  return (
    <CmsPreviewContext.Provider
      value={{
        preview,
        editMode,
        sectionSaveState,
        setPreviewSections,
        setEditMode,
        requestEditSection,
        updateField,
        updateImage,
        saveSection,
        markSectionSaved,
        markSectionSaveError,
        markAllSaved,
      }}
    >
      {children}
    </CmsPreviewContext.Provider>
  );
}

export function useCmsPreviewContext() {
  return useContext(CmsPreviewContext);
}
