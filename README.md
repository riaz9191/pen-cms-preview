# @pen/cms-live-preview

Shared live-preview / inline-editing kit for CMS-driven sites: the
context, editable field/section/image components, and postMessage
listeners that let a site render itself inside the CMS's preview
iframe and be edited in place.

## Install

```json
"@pen/cms-live-preview": "github:riaz9191/pen-cms-preview#v0.1.1"
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
} from "@pen/cms-live-preview";

<CmsPreviewProvider>
  <CmsPreviewListener />
  <CmsImageEditManager />
  {children}
</CmsPreviewProvider>
```

```tsx
// a page component
import { useCmsPreview, EditableField, EditableSection } from "@pen/cms-live-preview";

const contents = useCmsPreview(sectionId, serverContents);

<EditableSection sectionId={sectionId}>
  <EditableField as="h1" sectionId={sectionId} fieldName="title" value={contents.title} />
  <EditableField richText sectionId={sectionId} fieldName="body" value={contents.body} />
</EditableSection>
```

Images: tag the `<img>` itself with `data-cms-field="..."` inside an
`EditableSection` — `CmsImageEditManager` finds it via DOM scan, no
per-image wiring needed.

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
@source "../../node_modules/@pen/cms-live-preview/dist";
```

(adjust the `../../` depth to however many levels your CSS file sits
below the project root).

## Releasing a fix

```sh
# bump version in package.json, then:
git commit -am "..."
git tag vX.Y.Z
git push origin main --tags
```

Then in each consuming site: bump the `#vX.Y.Z` tag in `package.json`
and run `npm install @pen/cms-live-preview@github:riaz9191/pen-cms-preview#vX.Y.Z`
explicitly — plain `npm install` does not reliably re-resolve a
changed git tag on its own.
