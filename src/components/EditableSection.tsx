"use client";

import { useCmsPreviewContext } from "../contexts/CmsPreviewContext";

export default function EditableSection({
  sectionId,
  children,
}: {
  sectionId: string;
  children: React.ReactNode;
}) {
  const { editMode, requestEditSection } = useCmsPreviewContext();

  if (!editMode) return <>{children}</>;

  return (
    <div className="group/cms-editable relative" data-cms-section-id={sectionId}>
      <div className="pointer-events-none absolute inset-0 z-40 opacity-0 outline-2 outline-dashed outline-offset-[-2px] outline-[#00FFD2] transition-opacity group-hover/cms-editable:opacity-100" />
      <button
        type="button"
        aria-label="Edit this section"
        onClick={(e) => {
          e.stopPropagation();
          requestEditSection(sectionId);
        }}
        className="absolute top-3 right-3 z-50 flex items-center gap-1.5 rounded-full bg-[#00FFD2] px-3 py-1.5 text-xs font-semibold text-[#061665] opacity-0 shadow-lg transition-opacity group-hover/cms-editable:opacity-100 hover:brightness-95"
      >
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
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          <path d="m15 5 4 4" />
        </svg>
        Edit
      </button>
      {children}
    </div>
  );
}
