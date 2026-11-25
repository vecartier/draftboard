# Draftboard for Claude

Wireframe in Draftboard without leaving Claude. Every board is its own Claude artifact, like a Design: it opens beside the chat, you draw on it by hand or ask Claude for drafts, you share it from its own Share menu, and Claude builds it into code later.

- **`/draftboard:board`** opens a fresh blank board in a couple of seconds.
- **`/draftboard:flow`** opens a blank flow chart: process, decision, start/end, input/output, document and database shapes, joined by connectors that stick to the shapes, follow them when they move and carry labels like Yes and No. **`/draftboard:flow how a refund gets approved`** has Claude draft it, laid out automatically. Drag from a shape's side dot to add the next step, press Tab to add one below, and double-click a connector to label it.
- **`/draftboard:board a checkout flow with cart and payment`** makes a new board with Claude's first draft on it.
- **Iterate** by asking in the chat ("make Pay sticky", "add an error state"), or leave comments on the board with the artifact's own comments and send them to Claude: Claude makes the change, replies on the thread and resolves it. Every Claude change is one ⌘Z.
- **Come back later**: "open my Checkout board" finds the board by name, opens it beside the chat and picks up where you left off.
- **Build it**: paste the board's link into Claude Code in your project ("build this"), or run `/draftboard:build <link or name>`. Claude reads the screens, copy, flows, notes and comments, and builds them in your project's own stack and components.
- **Sharing**: from the board's Share menu. People you share it with can view it; only you (and anyone you give edit access) change it.

## Install

Inside Claude Code:

```
/plugin marketplace add vecartier/draftboard
/plugin install draftboard@draftboard
```

Or from a terminal: `claude plugin marketplace add vecartier/draftboard && claude plugin install draftboard@draftboard`. Start a new session afterwards.

Prefer the open [skills](https://github.com/vercel-labs/skills) installer? `npx skills add vecartier/draftboard -g -a claude-code` installs the same skills (as `/board`, `/flow` and `/build`), without the plugin's quick blank board (a blank board then takes Claude a few more seconds). Use one route or the other, not both.

It needs Claude Code with Claude artifacts (a claude.ai account), and nothing else: no server, nothing running on your computer.

**Your first board can take a few minutes.** Claude publishes the Draftboard editor (in `skills/board/engine/`) as a private artifact of your own, which your boards then copy on the server, so every board after that opens at once. When the plugin updates its editor, Claude refreshes that copy on your next `/draftboard`.

## How it works

Each board artifact is a small page plus the Draftboard editor, copied on the server from your own private engine artifact (recorded in `~/.claude/draftboard/engine.json`). The board lives in the artifact's own database, with a readable copy (outline, hand-off JSON and a picture) that Claude reads through the artifact tools. Claude drafts by dropping a draft in the board's inbox, and the open board applies it.

`skills/board/engine/` is the built editor (from the Draftboard app, `npm run build:engine`); `skills/board/board.html` is the page template; `skills/board/draft-reference.md` is the draft format and component catalog; `skills/flow/flow-reference.md` is the flowchart draft format. A flow chart is a board whose page says `"type": "flow"`, so it opens with the flowchart tools.
