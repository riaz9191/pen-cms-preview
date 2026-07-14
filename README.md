# @riaz91/cms-live-preview

Shared live-preview / inline-editing kit for CMS-driven sites: the
context, editable field/section/image components, and postMessage
listeners that let a site render itself inside the CMS's preview
iframe and be edited in place.

This repo is **public** and consumed as a git dependency — no npm
registry, no tokens, no per-person setup. Anyone can `npm install`
it; there's nothing secret in here (no API keys, no business logic).

## One-time setup per machine (only needed once, ever)

GitHub's SSH endpoint always requires a registered key, even for
public repos — but npm's `github:owner/repo` shorthand tries SSH by
default. Run this once per machine so npm/git transparently use
HTTPS instead (which works with zero auth for a public repo):

```sh
git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
```

## Install

```json
"@riaz91/cms-live-preview": "npm install @riaz91/cms-live-preview"
```

then `npm install`.

## Wiring into a site

```tsx
// app/layout.tsx
import {
  CmsPreviewProvider,
  CmsPreviewListener,
  CmsEditModeListener,
  CmsImageEditManager,
} from "@riaz91/cms-live-preview";

<CmsPreviewProvider>
  <CmsPreviewListener />
  <CmsImageEditManager />
  {children}
</CmsPreviewProvider>
```

```tsx
// a page component
import { useCmsPreview, EditableField, EditableSection } from "@riaz91/cms-live-preview";

const contents = useCmsPreview(sectionId, serverContents);

<EditableSection sectionId={sectionId}>
  <EditableField as="h1" sectionId={sectionId} fieldName="title" value={contents.title} />
  <EditableField richText sectionId={sectionId} fieldName="body" value={contents.body} />
</EditableSection>
```

Images: tag the `<img>` itself with `data-cms-field="..."` inside an
`EditableSection` — `CmsImageEditManager` finds it via DOM scan, no
per-image wiring needed. Flat content fields only (see "Known
limitations" below).

## Tailwind v4 setup (required)

Every component here ships its own Tailwind utility classes (the
Save button, image-change overlay, editable-field focus rings,
section Edit border). **Tailwind v4 excludes `node_modules` from its
automatic source detection**, so without an explicit `@source` these
classes silently generate no CSS — the whole editing UI renders
unstyled while everything else on the site looks fine, which is easy
to miss since it only shows up in CMS edit mode.

Add to the consuming site's global CSS:

```css
@import "tailwindcss";
@source "../../node_modules/@riaz91/cms-live-preview/dist";
```

(adjust the `../../` depth to however many levels your CSS file sits
below the project root).

## Known limitations

- `CmsImageEditManager` only supports flat content fields (e.g.
  `top_left_image`). It has no equivalent of `EditableField`'s
  `buildValue` callback, so images inside an array of entities (a
  campus's image, a course's image, a news story's image) aren't
  wireable yet without corrupting the array on save.

## Releasing a fix

```sh
# bump version in package.json, then:
git commit -am "..."
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

Then in each consuming site: bump the `#vX.Y.Z` tag in `package.json`
and run `npm install @riaz91/cms-live-preview@git+https://github.com/riaz9191/pen-cms-preview.git#vX.Y.Z`
explicitly — plain `npm install` does not reliably re-resolve a
changed git tag on its own.
