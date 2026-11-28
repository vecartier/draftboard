---
name: build
description: Builds a Draftboard board into working code in the current project, screen by screen, matching its layout, copy and flows. Use when the user types /draftboard:build, pastes a Draftboard board link and asks to build it, or asks to implement, build or code a Draftboard board or wireframe (by name or link).
argument-hint: "[board link or name]"
---

# Build from a Draftboard board

The board is in `$ARGUMENTS`: a link, or a board's name ("build my Checkout board"). For a name, find it with the Artifact tool, `action: "list"`: a board's title is its name, and its files (`scope: "files"`) include `draftboard.js`; if several fit, ask which in one line. With nothing given, use the board made or opened most recently in this conversation, or ask which board in one short question.

## 1. Read the board

A board artifact keeps a readable copy of itself for Claude. Read it with the ArtifactData tool on the board's URL:

1. `action: "list"`, `collection: "board"`, with `out_dir` set to a folder in your scratchpad (the copy is too big to read inline). Find the file for the document whose id is `handoff.<board id>` (no `~`). If there is none, the board has never been opened and edited: ask the user to open it once, and stop.
2. That document has `name`, `updated`, `outline`, `parts`, `t`, `json` and `png`. Read `outline` first: it lists every frame, the flows between frames, the flow chart (steps, connections and Mermaid), each section and mood board with its pictures, and open comments, then each frame's contents in reading order. On a big board some frames' details are left out, and the outline names them at the end.
3. For the full detail, join the hand-off JSON (format `draftboard.handoff/1`): the head's `json`, then the `v` of the documents `handoff.<board id>~1` … `~<parts-1>`, in that order. Each part's `t` equals the head's `t`; if one doesn't, the board was saving: list again. It has frames with their children (positions in points, relative to each frame), text, components, Lucide icon names, colours, `flows` between frames, the `flowchart`, loose `canvas` items (sections, mood board cards, notes), and open `comments`. Every item names the section it sits in (`section`).
4. Look at it before you write code. `png` is a small picture of the whole board (Artifact tool, `action: "read"`, the board's `url`, `path`: `png.assetId`), good for the overall layout only. For a sharp picture of the frames you're building, ask the open board for them: ArtifactData `action: "set"`, `collection: "inbox"`, a new `doc_id` (`picture-<short timestamp>`), `data: {"picture": ["<frame name or id>", "<section name>", "flowchart"]}` (up to 20). Then `action: "get"` the same document: `status: "applied"` comes with `pictures: [{name, id, assetId}]` (and `missing` for names it didn't find); read each `assetId` with the Artifact tool. With no `status` after a few seconds the board isn't open: open it (Artifact `action: "open"`) and check again. If the board is too old to answer (no `status` once open), update it to the latest editor (board skill) or go by the outline and `png`.

The copy updates a few seconds after each edit. Notes and open comments are requirements from the user, so treat them as part of the spec. Rough ink is intent, not pixels.

### What each part of a board is for

- **Wireframes** (frames with a device): screens to build. Frames named alike ("iPhone 18 Pro" twice) are told apart by id; ask which to build when it matters.
- **Flow chart** (`flowchart`): the logic of a journey. Use it for navigation, states and branching (decisions are `if`s or routes, each labelled connection a case). It is not a screen to draw, unless the user asks for a diagram.
- **Mood boards** (sections with `board: true`): visual references. Each card's `heading` names it and `text` says why it matters. Read the pictures you need (`asset`, with the Artifact tool and `path` = that id) and take the look from them (type, spacing, colour, density, motion hints), not their content or brands.

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
