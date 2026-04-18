# Quack Sort

Sorting algorithms, visualized with stacks of ducks.

Each column is an item; its value is the number of ducks in the stack. Watch short stacks shuffle to the left and tall stacks waddle to the right.

## Features

- 15 algorithms: Bubble, Cocktail Shaker, Insertion, Selection, Gnome, Odd-Even, Comb, Shell, Merge, Quick, Heap, Pancake, Counting, Radix (LSD), Bucket.
- Play / Pause / Step forward / Step back / Reset / Shuffle.
- Four starting distributions: random, nearly-sorted, reversed, few-unique.
- Big-O badges (best / average / worst / space + stable / in-place).
- Live stats: comparisons, swaps, writes, elapsed time, progress.
- Optional WebAudio sound: quack on swap, splash on compare.
- Dark mode, persisted in `localStorage`.
- Keyboard shortcuts: `Space` play/pause, `←/→` step, `S` shuffle, `R` reset.

## Run locally

```bash
npm install
npm run dev       # Vite dev server
npm test          # Vitest — one test per algorithm generator
npm run build     # Production build (outputs to dist/)
```

## Deploy

Pushes to `main` run `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages at `https://<user>.github.io/quack-sort/`.

In repo **Settings → Pages**, set *Build and deployment → Source* to **GitHub Actions**.

If your repo has a different name, update `base` in `vite.config.ts` and the redirect in `public/404.html` to match.

## Add a new algorithm

1. Create `src/algorithms/<name>.ts` that exports a `SortAlgorithm` whose `run` is a generator yielding `SortEvent`s.
2. Append it to the list in `src/algorithms/index.ts`.
3. Add a test in `src/algorithms/__tests__/sorts.test.ts` (it iterates the registry automatically — new algorithms are picked up for free).

That's it — the runner, visualizer, and settings panel are data-driven.
