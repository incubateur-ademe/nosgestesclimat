# NGC Quick Doc

This is a minimal documentation based on
[`@publicodes/react-ui`](https://publi.codes/docs/api/react-ui) and
[Vite](https://vitejs.dev/) to help you to implement the model and have a quick
feedback.

## To start

```bash
# install dependencies
pnpm && cd quick-doc && pnpm i

# start the development server
pnpm dev

# start the client
pnpm doc
```

## Deploy on GitHub Pages (home + doc only)

The `build:gh-pages` script builds quick-doc in a dedicated mode that publishes
only the `/` and `/doc` routes.

```bash
pnpm --filter quick-doc run build:gh-pages
```

An automated workflow is available in
`.github/workflows/publish-quick-doc-gh-pages.yml`.

1. Enable GitHub Pages in repository settings and choose `GitHub Actions` as source.
2. Run the `publish-quick-doc-gh-pages` workflow manually, or push changes to `main` in `quick-doc/`.
3. The app is published on `https://<org-or-user>.github.io/nosgestesclimat/`.
