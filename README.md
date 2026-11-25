# Draftboard for Claude

Wireframe in Draftboard without leaving Claude. Every board is its own Claude artifact, like a Design: it opens beside the chat, you draw on it by hand or ask Claude for a first draft, you share it from its own Share menu, and Claude builds it into code later.

- **`/draftboard`** makes a blank board. **`/draftboard a checkout flow with cart and payment`** makes one with Claude's first draft on it. Ask for more ("add an error state to Payment") and Claude drafts into the open board; each draft is one ⌘Z.
- **Sharing**: use the board's Share menu. People you share it with can view it; only you (and anyone you give edit access) change it.
- **`/build-from-board <board link>`** reads the board (its screens, copy, flows, notes and comments) and builds it in the current project, in that project's own stack and components.

## Install

```bash
npx draftboard
```

That adds the plugin to Claude Code (it runs `claude plugin marketplace add vecartier/draftboard` and `claude plugin install draftboard@draftboard`). Or, inside Claude Code:

```
/plugin marketplace add vecartier/draftboard
/plugin install draftboard@draftboard
```

It needs Claude Code with Claude artifacts (a claude.ai account), and nothing else: no server, nothing running on your computer.

**Your first board takes a few minutes.** Claude publishes the Draftboard editor (in `engine/`) as a private artifact of your own, which your boards then copy on the server, so every board after that opens at once. When the plugin updates its editor, Claude refreshes that copy on your next `/draftboard`.

## How it works

Each board artifact is a small page plus the Draftboard editor, copied on the server from your own private engine artifact (recorded in `~/.claude/draftboard/engine.json`). The board lives in the artifact's own database, with a readable copy (outline, hand-off JSON and a picture) that Claude reads through the artifact tools. Claude drafts by dropping a draft in the board's inbox, and the open board applies it.

`engine/` is the built editor (from the Draftboard app, `npm run build:engine`); `skills/draftboard/board.html` is the page template; `skills/draftboard/draft-reference.md` is the draft format and component catalog.
