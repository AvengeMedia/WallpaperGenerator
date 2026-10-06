# Wallpaper Generator

Material 3 wallpaper generator compatible with [DMS](https://danklinux.com). Compose shapes, patterns and palettes, then export a PNG or a JSON layout that DMS renders as a live wallpaper.

Live at [wallpaper.danklinux.com](https://wallpaper.danklinux.com).

## Stack

- Vite+ + React 19 + TypeScript
- Tailwind CSS v4 (Material 3 tokens mapped in `src/globals.css`)
- TanStack Store and Hotkeys
- `material-shapes-ts` for the shape library
- Static build served by nginx in a container

## Develop

```sh
npm install
npm run dev
```

| Script           | What it does                |
| ---------------- | --------------------------- |
| `npm run dev`    | dev server with HMR         |
| `npm run build`  | production build to `dist/` |
| `npm run lint`   | oxlint (vite+)              |
| `npm run format` | oxfmt (vite+)               |

Install [prek](https://prek.j178.dev/) and activate the hooks:

```sh
prek install
```

The hooks runs vite+'s lint and format with typecheck and typeaware linting enabled, plus generic whitespace and YAML checks. `prek run --all-files` runs them on demand.

## Layout

```
src/
  lib/         pure logic: shapes, color math, formats, layout file, png render, storage
  store/       TanStack stores: wallpaper (layers, prefs, undo/redo) and ui (panel state)
  hooks/       theme colors, pattern tiles, export, import, keyboard shortcuts
  components/
    ui/        reusable primitives: button, icon button, slider, radio group, segmented, tabs, swatch, toast
    canvas/    preview and svg stage with drag, wheel resize and rotate
    panel/     settings panel: toolbar, global tab, shape tab, shape picker
```

## JSON layout

The export matches the DMS wallpaper format. Positions are centre fractions of the canvas, size is a fraction of the shorter side, rotation is in degrees.

```json
{
  "layers": [
    {
      "shape": "flower",
      "x": 0.1,
      "y": 0.1,
      "size": 0.52,
      "rotation": 0,
      "fill": "tertiaryContainer",
      "overlap": "primaryContainer"
    }
  ],
  "pattern": "topography",
  "strength": 0.1
}
```

## Deploy

`Dockerfile` builds the static bundle into an unprivileged nginx image. On every push to `master`, `.github/workflows/ci.yml` runs format, lint and typecheck, builds a multi-arch image to ghcr.io, then applies `k8s/` with kustomize into the `wallpaper` namespace.

The deploy job runs under the `production` GitHub environment, which holds the `KUBE_CONFIG_DATA` secret and is restricted to the `master` branch. That kubeconfig is a service account token scoped to the `wallpaper` namespace only, so the workflow cannot touch anything else in the cluster. To create it:

```sh
./k8s/generate-kubeconfig.sh
base64 -w0 k8s/wallpaper-kubeconfig.yaml
```

## Credits

Ported from the original [wall](https://github.com/hthienloc/wall) generator by **Zurvan** ([@georgestafilidis](https://github.com/georgestafilidis)) and **Stumbling** ([@apollo79](https://github.com/apollo79)). MIT licensed.
