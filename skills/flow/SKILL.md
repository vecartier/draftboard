---
name: flow
description: Draftboard flow charts, each its own Claude artifact beside the chat. Makes a flow chart (blank, or with Claude's first draft laid out automatically), changes one when asked or from comments left on it, and reopens an older one by name. Use when the user types /draftboard:flow, asks for a flow chart, flowchart, process or decision diagram, or mentions a Draftboard flow chart (by name or link). For wireframes of screens, use the board skill.
argument-hint: "[what to chart, or which flow chart to change]"
---

# Draftboard flow charts

A flow chart is a Draftboard board that opens with the flowchart tools up front: steps (process, decision, start/end, input/output, document, database and a few more) joined by connectors that stick to the shapes, follow them when they move, and carry labels like Yes and No. It is the same editor and the same kind of artifact as a wireframe board, so everything in the board skill applies. Its files are in the board skill's folder, next to this one (`../board`): `new-board.sh`, `board.html`, `engine/`, and `SKILL.md` for the shared steps.

The request is `$ARGUMENTS`. Decide what it asks for:

- **Empty:** make a blank flow chart named "Untitled flow chart".
- **About a flow chart or board that already exists** (it names one, links one, or says "my signup flow", "add a step to…"): find it (as in the board skill's "Pick up an older board"), read it, then change it.
- **Anything else:** make a new flow chart named after the request (two to four words, like "Checkout flow"), then draft the request into it.

## Make a flow chart

Exactly as the board skill's "Make a board", with two differences:

1. Prepare it with `bash "<board skill folder>/new-board.sh" "<your scratchpad folder>" "<name>" flow`. The third argument makes it a flow chart. `engine-needed` means setting the engine up first, as the board skill says.
2. Publish it with `icon` `"flowchart"` and `description` "A Draftboard flow chart.", and the same `files` and `capabilities` as a board.

With no request, reply in one line that it's open, and stop.

## Draft into it

Read `flow-reference.md` (next to this file) once per session before your first draft. Then drop the draft into the chart's inbox with the ArtifactData tool, on its URL: `action: "set"`, `collection: "inbox"`, a new `doc_id` (like `draft-<short timestamp>`), `data: {"draft": {"flowchart": {...}}, "mode": "merge"}`. Check it with `action: "get"` as the board skill describes: `status: "applied"` (with `steps`), or `"error"` with a `message` to fix.

A good flow chart: one clear start and at least one end, every decision with labelled branches (Yes / No, or the actual answers), short labels in the user's words (a verb for steps, a question for decisions), and roughly 5 to 20 steps. Split a bigger process into several charts or use subprocess steps.

Reply in one or two lines: what you charted, the link, and that ⌘Z undoes the draft.

## Change it

Read it first: the board's readable copy (`board` collection, the `handoff.<id>` document, see the build skill, step 1) has a `## Flowchart` section in its `outline` with every step's id, shape and text, every connection, and the chart as Mermaid. Steps Claude drafted keep the ids you gave them; steps drawn by hand use their element id. Then send a `merge` draft that names only what changes:

- a step with an existing id is updated in place (text, shape, colour) and keeps the position the user gave it;
- new steps are laid out next to the ones they connect to;
- `remove` takes step ids (which also removes their connectors) and `"from->to"` pairs.

Never redraw the whole chart with `replace` unless the user asks for a fresh start. Each draft is one ⌘Z on the chart.

## Comments, reopening, sharing

Exactly as the board skill: comments on the chart are read and answered with the ArtifactComments tool, an older chart is found by its title with Artifact `action: "list"`, and the user shares it from the artifact's Share menu.

## Using a flow chart elsewhere

When the user wants the chart in code or docs, read it (above) and work from its steps and connections: the Mermaid in the outline drops straight into Markdown, and the steps and branches map onto functions, states or a state machine in their project.
