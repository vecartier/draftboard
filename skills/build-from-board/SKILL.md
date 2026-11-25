---
name: build-from-board
description: Builds a Draftboard board into working code in the current project, screen by screen, matching its layout, copy and flows. Use when the user types /build-from-board, pastes a Draftboard board link and asks to build it, or asks to implement, build or code a Draftboard board or wireframe (by name or link).
argument-hint: "[board link or name]"
---

# Build from a Draftboard board

The board is in `$ARGUMENTS`: a link, or a board's name ("build my Checkout board"). For a name, find it with the Artifact tool, `action: "list"`: a board's title is its name, and its files (`scope: "files"`) include `draftboard.js`; if several fit, ask which in one line. With nothing given, use the board made or opened most recently in this conversation, or ask which board in one short question.

## 1. Read the board

A board artifact keeps a readable copy of itself for Claude. Read it with the ArtifactData tool on the board's URL:

1. `action: "list"`, `collection: "board"`. Find the document whose id starts with `handoff.` and has no `~` (for example `handoff.<board id>`). If there is none, the board has never been opened and edited: ask the user to open it once, and stop.
2. That document has `name`, `updated`, `outline` (a readable summary: each frame with its device, size and system bar, then its contents in reading order), `parts`, `json` and `png`. The full hand-off JSON (format `draftboard.handoff/1`) is its `json` followed by the `json` of the documents `handoff.<board id>~1` … `~<parts-1>`, joined in order. It has frames with their children (positions in points, relative to each frame), text, components, Lucide icon names, colours, `flows` between frames, loose `notes`, and open `comments`.
3. See the board: Artifact tool, `action: "read"`, the board's `url`, `path`: `png.assetId`. Look at it before you write code.

The copy updates a few seconds after each edit, and the picture every couple of minutes. Notes and open comments are requirements from the user, so treat them as part of the spec. Rough ink is intent, not pixels.

## 2. Fit it to the project

Look at the project before writing anything: its framework, routing, component library, styling (tokens, Tailwind, CSS modules), icon set, and how existing screens are built. Then map the board onto it:

- each frame becomes a screen, route or view, named after the frame;
- each flow becomes navigation between those screens;
- Draftboard components (navigation bar, tab bar, buttons, lists, fields) become the project's own components where they exist;
- Lucide icons become the project's icon set, by the closest match;
- positions describe layout intent: build with the project's layout system (stacks, flex, grid, safe areas), not absolute coordinates;
- copy is used word for word.

If the project is empty or has no UI yet, ask once which stack to use, and suggest the obvious one for the board's devices (SwiftUI for iPhone frames, React for web).

Tell the user the plan in a few lines (screens, where they go, anything you'll reuse), and continue without waiting unless something is genuinely ambiguous.

## 3. Build

Build one screen at a time, in flow order. After each, run the project's typecheck or build. When the project can run (a dev server, a simulator), open the screen and compare it with the board's picture, and fix clear mismatches in layout, spacing and copy before moving on.

Never change the board while building. If the board and the project disagree (a component that doesn't exist, a flow to a screen that isn't drawn), follow the board where you can and list the gap at the end.

## 4. Report

Reply with what you built (screens and where they live), how to see it, and any gaps or guesses, each in one line.
