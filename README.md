<h1 align="center">audio</h1>

<p align="center">
  Interface sounds with a sense of direction.
</p>

## What's in this repo

| Path | What |
|------|------|
| [`packages/audio`](./packages/audio) | **`@outpacelabs/audio`**, the published package: sound specs + Web Audio engine + React hook. |
| [`src`](./src) | The Next.js site: the playground and the article. |

## Local development

This repo is managed with **pnpm** (see `packageManager` in `package.json`).

```bash
pnpm install          # install deps (workspace)
pnpm packages:build   # build the package (the site imports it)
pnpm dev              # run the site → http://localhost:3000
pnpm test             # property tests for the sound specs
pnpm typecheck        # site + package
```

## License

[MIT](./LICENSE), free to use. By [Outpace Studios](https://outpacestudios.com).
