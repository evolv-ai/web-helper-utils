# web-helper-utils
Package containing methods to help coding experiments using Evolv

This branch is compiant with Evolv integrations as the `"main"` in `package.json` points to the compiled es5 output `dist/index.js`, which also exports a function which binds the helper methods to `window.evolv.helpers`.

# Getting Started

* `npm i`
* `npm run build`

Code is written in TypeScript inside of `/src/`.

To compile to es5, run `npm run build` to update the es5 output to `/dist`.

# Contributing
Be sure to update the `/dist` output before pushing changes up to the repo by running `npm run build`.