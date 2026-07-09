/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCmsPreviewContext } from "../contexts/CmsPreviewContext";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import InlineSaveButton from "./InlineSaveButton";
import MarkupRenderer, { type MarkupClassNames } from "./MarkupRenderer";

interface EditableFieldProps {
  sectionId: string;
  fieldName: string;
  value: string;
  /** Edit as contentEditable HTML (via MarkupRenderer) instead of plain text. */
  richText?: boolean;
  /** Plain-text mode only: tag for the editable element. Defaults to "span". */
  as?: any;
  className?: string;
  /** Rich-text mode only: per-tag classes applied by MarkupRenderer. */
  classNames?: MarkupClassNames;
  /** Plain-text mode only: transform the edited text before it's sent back
   * (e.g. to update only the `text` key of a link field while preserving `url`). */
  buildValue?: (newText: string) => unknown;
  /** Props (e.g. cursor-follow handlers) applied only when NOT in edit mode. */
  passthroughProps?: Record<string, unknown>;
}

/**
 * Strips MarkupRenderer's injected presentational classes back out, keeping
 * only the semantic tag structure — so saving a rich-text edit writes clean
 * HTML back, not the styled/rendered markup.
 */
function serializeClean(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  const strip = (el: Element) => {
    el.removeAttribute("class");
    el.removeAttribute("style");
    el.removeAttribute("contenteditable");
    Array.from(el.children).forEach(strip);
  };
  Array.from(clone.children).forEach(strip);
  return clone.innerHTML;
}

/**
 * Renders the SAME underlying DOM node in both edit and non-edit modes
 * (plain-text mode never unmounts on `editMode` toggles, so GSAP refs
 * pointing at this element stay valid across the transition).
 *
 * Two flavors sharing one dirty-tracking/save-button implementation:
 * - plain text (`richText` unset): commits `element.textContent`.
 * - rich text (`richText`): commits sanitized `innerHTML` via MarkupRenderer.
 */
const EditableField = forwardRef<HTMLElement, EditableFieldProps>(function EditableField(
  {
    sectionId,
    fieldName,
    value,
    richText = false,
    as: Tag = "span",
    className,
    classNames,
    buildValue,
    passthroughProps,
  },
  forwardedRef,
) {
  const { editMode, updateField, sectionSaveState } = useCmsPreviewContext();
  const innerRef = useRef<HTMLElement>(null);
  // This specific field currently differs from the last-known value —
  // anchors the inline Save button right under this element.
  const [dirty, setDirty] = useState(false);
  // Rich-text only: rendered content is frozen while focused so
  // MarkupRenderer's re-parse (fresh DOM nodes every render) can't fight the
  // browser's own contentEditable cursor/selection mid-edit.
  const [isFocused, setIsFocused] = useState(false);
  const [frozenValue, setFrozenValue] = useState(value);
  const saveState = sectionSaveState[sectionId];
  // The raw value we last sent via updateField, so we can tell "value
  // changed because our own edit echoed back" apart from "value changed
  // because something else (CMS Undo, another editor) superseded it."
  const [lastCommitted, setLastCommitted] = useState<string | null>(null);

  // Render-time state adjustments per react.dev/learn/you-might-not-need-an-effect.
  // Section was saved (state cleared by the CMS confirmation) — hide the button.
  const [prevSaveState, setPrevSaveState] = useState(saveState);
  if (saveState !== prevSaveState) {
    setPrevSaveState(saveState);
    if (dirty && saveState === undefined) setDirty(false);
  }
  // The authoritative value no longer matches what we last committed — our
  // pending edit was superseded elsewhere (e.g. the CMS's own Undo).
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!richText || !isFocused) {
      if (richText) setFrozenValue(value);
      if (lastCommitted !== null && value !== lastCommitted) {
        setDirty(false);
        setLastCommitted(null);
      }
    }
  }

  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLElement);

  // Plain-text mode only: pure external-system sync (the browser's
  // contentEditable DOM) — no setState here, kept separate from the
  // render-time adjustments above.
  useEffect(() => {
    if (richText || !editMode) return;
    if (!innerRef.current || document.activeElement === innerRef.current) return;
    if (innerRef.current.textContent !== (value ?? "")) {
      innerRef.current.textContent = value ?? "";
    }
  }, [value, editMode, richText]);

  const readCurrent = () => {
    if (!innerRef.current) return "";
    return richText
      ? serializeClean(innerRef.current as HTMLElement)
      : innerRef.current.textContent ?? "";
  };

  // Re-checks the live DOM against the current value and keeps `dirty` in
  // sync — so undoing back to the original hides the Save button again
  // instead of leaving a false-positive prompt.
  const syncDirty = () => {
    setDirty(readCurrent() !== (value ?? ""));
  };

  const commit = () => {
    if (richText) setIsFocused(false);
    const current = readCurrent();
    if (current === (value ?? "")) {
      setDirty(false);
      return;
    }
    setLastCommitted(current);
    setDirty(true);
    updateField(sectionId, fieldName, richText || !buildValue ? current : buildValue(current));
  };

  if (richText && !editMode) {
    return (
      <div className={className} {...passthroughProps}>
        <MarkupRenderer htmlString={value ?? ""} classNames={classNames} />
      </div>
    );
  }

  if (richText) {
    return (
      <>
        <div
          ref={innerRef as React.Ref<HTMLDivElement>}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => setIsFocused(true)}
          onInput={syncDirty}
          onBlur={commit}
          className={`${className ?? ""} cursor-text rounded-sm outline-none transition hover:ring-2 hover:ring-[#00FFD2]/60 focus:ring-2 focus:ring-[#00FFD2]`}
          {...passthroughProps}
        >
          <MarkupRenderer htmlString={frozenValue ?? ""} classNames={classNames} />
        </div>
        <InlineSaveButton
          anchorRef={innerRef}
          sectionId={sectionId}
          visible={dirty}
          beforeSave={() => (innerRef.current as HTMLElement | null)?.blur()}
        />
      </>
    );
  }

  return (
    <>
      <Tag
        ref={innerRef}
        className={`${className ?? ""} ${
          editMode
            ? "cursor-text rounded-sm outline-none transition hover:ring-2 hover:ring-[#00FFD2]/60 focus:ring-2 focus:ring-[#00FFD2]"
            : ""
        }`}
        contentEditable={editMode || undefined}
        suppressContentEditableWarning={editMode || undefined}
        onInput={editMode ? syncDirty : undefined}
        onBlur={editMode ? commit : undefined}
        onKeyDown={
          editMode
            ? (e: React.KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  (e.target as HTMLElement).blur();
                }
                if (e.key === "Escape") {
                  if (innerRef.current) innerRef.current.textContent = value ?? "";
                  setDirty(false);
                  (e.target as HTMLElement).blur();
                }
              }
            : undefined
        }
        {...(editMode ? {} : passthroughProps)}
      >
        {value}
      </Tag>
      {editMode && (
        <InlineSaveButton
          anchorRef={innerRef}
          sectionId={sectionId}
          visible={dirty}
          beforeSave={() => innerRef.current?.blur()}
        />
      )}
    </>
  );
});

export default EditableField;
