# Architectural Decisions

This document records architectural decisions made during the development of flower-grower.

## ADR 001: Initial Technical Stack and Architecture Baseline
- **Date:** 2026-10-23
- **Status:** Accepted
- **Context:** Starting Phase 1 of `plan00.md`. A multi-package monorepo is required for library distribution, framework-agnostic core generation, three.js rendering, DOM overlay guides, Web Component custom elements, and an interactive playground.
- **Decision:**
  - Package manager: pnpm with workspace configuration.
  - Core package `@flower-grower/core` is strictly pure and deterministic without Three.js or DOM dependencies.
  - Renderer `@flower-grower/three` uses WebGL2 and shaders for growth animation, with Three.js as a peer dependency.
  - Linting enforces import boundaries and prevents `Math.random` or `Date.now` in `@flower-grower/core`.
- **Consequences:** Clean separation of concerns, testability, and portability.
