# Svelte Calculator

Simple sample project for [Svelte](https://svelte.dev).

Made for this [prompt](https://www.freecodecamp.org/learn/front-end-libraries/front-end-libraries-projects/build-a-javascript-calculator).

Generated with the svelte template from https://github.com/sveltejs/template.

## Local Setup

Clone the repo or download the files.

Install the dependencies.

```bash
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see the app running.

If you make changes, first run the following script to enable sym-links for git hooks.

```bash
./setup_git_hooks.bash
```

## Uses

- [Typescript](https://github.com/microsoft/TypeScript)
- [Jest](https://github.com/facebook/jest)
- [Svelte-testing-library](https://github.com/testing-library/svelte-testing-library)

## Building and running in production mode

To create an optimized version of the app:

```bash
npm run build
```

You can run the newly built app with `npm run start`. This uses [sirv](https://github.com/lukeed/sirv).
