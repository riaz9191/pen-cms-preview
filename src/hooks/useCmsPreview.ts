"use client";

import { useCmsPreviewContext } from "../contexts/CmsPreviewContext";

/**
 * Returns live preview content for a section if the CMS editor is active,
 * merged on top of the original server-fetched content.
 *
 * Usage:
 *   const contents = useCmsPreview(sectionId, serverContents);
 */
export function useCmsPreview<T extends Record<string, unknown>>(
  sectionId: string,
  serverContent: T
): T {
  const { preview } = useCmsPreviewContext();
  const liveContent = preview[sectionId];
  if (!liveContent) return serverContent;
  return { ...serverContent, ...liveContent } as T;
}
