export { CmsPreviewProvider, useCmsPreviewContext } from "./contexts/CmsPreviewContext";
export { useCmsPreview } from "./hooks/useCmsPreview";

export { default as EditableField } from "./components/EditableField";
export { default as EditableSection } from "./components/EditableSection";
export { default as CmsImageEditManager } from "./components/CmsImageEditManager";
export { default as InlineSaveButton } from "./components/InlineSaveButton";
export { default as InlineEditHint } from "./components/InlineEditHint";
export { default as CmsPreviewListener } from "./components/CmsPreviewListener";
export { default as CmsEditModeListener } from "./components/CmsEditModeListener";
export { default as MarkupRenderer } from "./components/MarkupRenderer";
export type { MarkupClassNames } from "./components/MarkupRenderer";

// Dot-path helpers for nested field editing — shared so the CMS backend can
// apply `cms-image-upload` / `cms-field-update` paths the same way the preview
// does (e.g. setIn(section.content, fieldName, value)).
export { parsePath, setIn, getIn, deepMerge } from "./lib/path";
export type { PathSeg } from "./lib/path";
