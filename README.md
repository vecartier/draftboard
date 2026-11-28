# Draftboard for Claude

A canvas for wireframes, flow charts, sketches and mood boards, inside Claude. Every board is its own Claude artifact: it opens beside the chat, you work on it by hand or ask Claude for a first draft, you share it from its Share menu, and Claude can build it into code later.

## Install

In a terminal:

```
npx github:vecartier/draftboard
```

It finds Claude Code (including the copy inside the Claude desktop app), adds the plugin and installs it. Run it again any time to update, or to repair a broken install. Then fully quit the Claude app (⌘Q on a Mac) or Claude Code, open it again, and type `/draftboard:board` in a new chat.

You need Node.js for `npx`, and Claude Code with a claude.ai account (for artifacts). Nothing else: no server, nothing running on your computer.

No git on your computer (`npx` says *An unknown git error occurred*, or a Mac asks to install developer tools)? Use this instead, which downloads the same thing without git:

```
npx https://github.com/vecartier/draftboard/archive/refs/heads/main.tar.gz
```

Other ways in:
- **Inside Claude Code:** `/plugin marketplace add vecartier/draftboard`, then `/plugin install draftboard@draftboard`.
- **Ask Claude:** paste *Install the Draftboard plugin: marketplace vecartier/draftboard, plugin draftboard@draftboard.* into a Claude Code chat.
- **The open [skills](https://github.com/vercel-labs/skills) installer:** `npx skills add vecartier/draftboard -g -a claude-code` installs the same skills as `/board` and `/build`, without the plugin's instant blank board. Use one route, not both.

**Your first board can take a few minutes**, while Claude publishes the editor as a private artifact of your own. Every board after that opens in seconds.

## Use it

| Command | What it does |
| --- | --- |
| `/draftboard:board` | Opens a blank board. |
| `/draftboard:board a checkout flow with cart and payment` | Opens a board with Claude's first draft on it. |
| `/draftboard:board open my Checkout board` | Finds an older board by name and picks up where you left off. |
| `/draftboard:build <link or name>` | Builds the board into your project, in its own stack and components. |

## Modes

Switch with the icons at the top of the board (hover for the name).

- **Wireframe**: phone, tablet and desktop frames, UI components, icons, shapes, images and text.
- **Flowchart**: process, decision, start/end, input/output, document and database shapes, joined by connectors that stick to shapes, re-route as you move things and carry labels like Yes and No. Tab adds the next step.
- **Draw**: pen, pencil, marker and highlighter with an eraser, one drawing layer per board, and freeform canvases. Works with Apple Pencil on iPad.
- **Mood board**: boards with a title and notes, picture cards with a title and caption in a grid you reorder by dragging, bulk add, paste or drop images, and circle or box highlights.

Notes, connectors and sections (to group things) sit alongside the mode's own tools. Images can be cropped and resized.

## Working with Claude

- **Iterate** by asking in the chat ("make Pay sticky", "add an error state"), or leave comments on the board and send them to Claude. Claude makes the change and replies on the thread. Every Claude change is one ⌘Z.
- **Share** from the board's Share menu. People you share with can view it; only you change it.
- **Build** by pasting the board's link into Claude Code in your project ("build this"). Claude reads the screens, copy, flows, notes and comments.

## How it works

Each board is a small page plus the Draftboard editor, copied on the server from your private engine artifact (its link is kept in `~/.claude/draftboard/engine.json`). The board is saved in the artifact's own database, with a readable copy (an outline, hand-off JSON and a picture) that Claude reads. Claude drafts by dropping a draft in the board's inbox, and the open board applies it. When the plugin ships a new editor, Claude refreshes your engine on your next `/draftboard`.

| Path | Contents |
| --- | --- |
| `skills/board/` | The board skill, page template (`board.html`), draft format (`draft-reference.md`, `flowchart-reference.md`) and helper scripts |
| `skills/board/engine/` | The built editor and its `VERSION` |
| `skills/build/` | The build skill |
| `installer/` | The `npx` installer |
| `hooks/` | Opens a blank board instantly for `/draftboard:board` with no request |

MIT licensed.
