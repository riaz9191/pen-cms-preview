# @riaz9191/cms-live-preview

Shared live-preview / inline-editing kit for CMS-driven sites: the
context, editable field/section/image components, and postMessage
listeners that let a site render itself inside the CMS's preview
iframe and be edited in place.

Published privately to GitHub Packages — the repo stays private, but
installs are a normal versioned `npm install`, no git URLs or SSH keys
involved.

## Install

Each consuming project needs an `.npmrc` (project-level is fine, not
secret) pointing the scope at GitHub's registry:

```
@riaz9191:registry=https://npm.pkg.github.com
```

Then, since GitHub Packages requires auth to *read* packages even
when the repo is private (there's no anonymous install), each
machine/CI needs a token with `read:packages` scope available as
`NODE_AUTH_TOKEN`, referenced from `~/.npmrc` (not committed):

```
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Generate the token at GitHub → Settings → Developer settings →
Personal access tokens (classic) → scope: `read:packages`.

Then in `package.json`:

```json
"@riaz9191/cms-live-preview": "^0.1.2"
```

## Wiring into a site

```tsx
// app/layout.tsx
import {
  CmsPreviewProvider,
  CmsPreviewListener,
  CmsEditModeListener,
  CmsImageEditManager,
} from "@riaz9191/cms-live-preview";

<CmsPreviewProvider>
  <CmsPreviewListener />
  <CmsImageEditManager />
  {children}
</CmsPreviewProvider>
```

```tsx
// a page component
import { useCmsPreview, EditableField, EditableSection } from "@riaz9191/cms-live-preview";

const contents = useCmsPreview(sectionId, serverContents);

<EditableSection sectionId={sectionId}>
  <EditableField as="h1" sectionId={sectionId} fieldName="title" value={contents.title} />
  <EditableField richText sectionId={sectionId} fieldName="body" value={contents.body} />
</EditableSection>
```

Images: tag the `<img>` itself with `data-cms-field="..."` inside an
`EditableSection` — `CmsImageEditManager` finds it via DOM scan, no
per-image wiring needed. Flat content fields only (see the
"Known limitations" note below).

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
@source "../../node_modules/@riaz9191/cms-live-preview/dist";
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

Bump `version` in `package.json`, commit, tag, and push the tag —
pushing a `vX.Y.Z` tag triggers `.github/workflows/publish.yml`,
which builds and publishes to GitHub Packages automatically (using
the repo's own `GITHUB_TOKEN`, no manual publish token needed):

```sh
git commit -am "..."
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

Then in each consuming site, bump the version range in `package.json`
and run `npm install`.
