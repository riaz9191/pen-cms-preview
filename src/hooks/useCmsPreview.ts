"use client";

import { useCmsPreviewContext } from "../contexts/CmsPreviewContext";
import { deepMerge } from "../lib/path";

/**
 * Returns live preview content for a section if the CMS editor is active,
 * merged on top of the original server-fetched content.
 *
 * The merge is deep (arrays element-wise by index) so a nested edit — e.g.
 * one item's image inside `teammembercards` — overlays just that field and
 * preserves every sibling. For plain top-level edits this is equivalent to the
 * previous shallow `{ ...server, ...live }` spread.
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
  return deepMerge(serverContent, liveContent);
}
