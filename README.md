# Quack Sort 🦆

[![Deploy to GitHub Pages](https://github.com/Joaolfelicio/quack-sort/actions/workflows/deploy.yml/badge.svg)](https://github.com/Joaolfelicio/quack-sort/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Live Demo
**Play now:** [https://joaolfelicio.github.io/quack-sort/](https://joaolfelicio.github.io/quack-sort/)

Sorting algorithms, visualized with stacks of ducks. 

Each column is an item; its value is the number of ducks in the stack. Watch short stacks shuffle to the left and tall stacks waddle to the right in real-time.

![Quack Sort Dark Mode](public/screenshot-dark.png)

## Features

- **16 Sorting Algorithms:** Bubble, Cocktail Shaker, Insertion, Selection, Gnome, Odd-Even, Comb, Shell, Merge, Quick, Heap, Pancake, Counting, Radix (LSD), Bucket Sort, and more.
- **Interactive Controls:** Play, Pause, Step forward, Step back, Reset, and Shuffle.
- **Adjustable Parameters:** Control item count, animation speed, and initial array distribution (random, nearly-sorted, reversed, few-unique, and **custom values**).
- **Educational:** Includes Big-O complexity badges (best / average / worst / space) and stability / in-place indicators for every algorithm.
- **Live Stats:** Tracks comparisons, swaps, writes, elapsed time, and progress percentage.
- **Accessible & Customizable:** Dark mode (persisted in `localStorage`), fully keyboard navigable, and optional WebAudio sound effects (quack on swap, splash on compare).

## Getting Started

To run the application locally:

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev

# Run unit tests (one test per algorithm generator)
npm test

# Build for production (outputs to dist/)
npm run build
```

## Adding a New Algorithm

The application is heavily data-driven. To add a new algorithm, you just need to write the logic and register it:

1. Create a new file `src/algorithms/<name>.ts`. Export a `SortAlgorithm` object where the `run` property is a generator function yielding `SortEvent`s.
2. Append your new algorithm to the exported list in `src/algorithms/index.ts`.
3. Add a test in `src/algorithms/__tests__/sorts.test.ts`. The test suite iterates over the registry automatically, so new algorithms are picked up for free!

## License

Distributed under the MIT License. See `LICENSE` for more information.
