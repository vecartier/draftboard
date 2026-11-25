---
name: draftboard
description: Creates a Draftboard board, a wireframe canvas that is its own Claude artifact and opens beside the chat, either empty for drawing by hand or with a first draft from Claude. Also drafts into an existing board. Use when the user types /draftboard, or asks to wireframe, sketch or mock up screens or a flow in Draftboard, or to draft into a Draftboard board link.
argument-hint: "[what to wireframe, or leave empty for a blank board]"
---

# Draftboard

Each Draftboard board is its own artifact: the Draftboard editor plus one board. It opens beside the chat, the user edits it by hand, shares it from its own Share menu (people it's shared with can view it, and only its editors change it), and Claude reads it later to build it in code (the build-from-board skill).

The request is `$ARGUMENTS`. If it's empty, make a blank board named "Untitled board".

## Your engine (once per person, and after a plugin update)

Boards copy the Draftboard editor from the person's own private **engine artifact**. Its link and version are kept in `~/.claude/draftboard/engine.json` (`{"url": ..., "version": ...}`). The editor is in the `engine/` folder next to this file: `draftboard.js`, `draftboard.css`, `index.html` and `VERSION`.

Before making a board, read both. If `engine.json` exists and its `version` equals `VERSION`, use its `url` as ENGINE and skip to "Make a board". Otherwise set the engine up:

1. Tell the user in one line: "Setting up your private copy of the Draftboard editor. This happens once and takes a few minutes."
2. Copy the four engine files into a new folder in your scratchpad (artifacts publish from there).
3. Read `draftboard.js` and `draftboard.css` in full (the Artifact tool publishes only what you have read). They are the minified Draftboard editor from this plugin; read them in parts if needed.
4. Publish with the Artifact tool: `file_path` the copied `index.html`, `files`: `{"draftboard.js": "<copied draftboard.js>", "draftboard.css": "<copied draftboard.css>"}`, `title`: "Draftboard engine", `icon`: "canvas", `description`: "The Draftboard editor your boards copy. Keep it.", the same `capabilities` as a board (below). With `url` the existing engine's URL when updating one (list its files first: `action: "list"`, `scope: "files"`), and no `url` the first time.
5. Write `~/.claude/draftboard/engine.json` with the engine's URL and `VERSION`. It stays private to the user, and only their own boards copy from it.

## Make a board

1. **Name it** in two to four words from the request ("Checkout", "Onboarding flow").
2. **Write its page.** Make a new folder in your scratchpad, and copy `board.html` (next to this file) to `index.html` there, replacing:
   - `{{BOARD_ID}}` with a fresh lowercase UUID (`uuidgen | tr A-Z a-z`),
   - `{{BOARD_NAME}}` with the name, HTML-escaped,
   - `{{BOARD_NAME_JSON}}` with the name escaped for a JSON string.
   Change nothing else in the file.
3. **Publish it** with the Artifact tool, a new artifact (no `url`):
   - `file_path`: that `index.html`; `title`: the name; `icon`: `"canvas"`; `description`: "A Draftboard wireframe board."
   - `files`: `{"draftboard.js": {"artifact": "ENGINE", "path": "draftboard.js"}, "draftboard.css": {"artifact": "ENGINE", "path": "draftboard.css"}}` where ENGINE is the person's engine URL. The editor is copied on the server, so boards need no reading or sending.
   - `capabilities`: `{"db": {"rules": [{"path": "board", "read": "view", "write": "admin"}, {"path": "inbox", "read": "admin", "write": "admin"}]}, "user": {}, "assets": {}, "downloads": true}`
   If the copy from ENGINE is refused (the engine was deleted), remove `engine.json`, set the engine up again, and retry.
4. The new board opens beside the chat. With no request, say in one line that the blank board is open, and stop.

## Draft into a board

Read `draft-reference.md` (next to this file) once per session before your first draft. Then add the draft to the board's inbox with the ArtifactData tool, on the board's URL:

- `action: "set"`, `collection: "inbox"`, a new `doc_id` (for example `draft-<short timestamp>`), `data: {"draft": <draft object>, "mode": "merge"}`.
- `merge` redraws frames with the same name and adds the rest, `append` always adds, and `replace` clears the board first (only when the user asks for that).

The open board applies the draft as one Undo step, then sets `status` on that inbox document. Check it with `action: "get"`: `"applied"` (with `frames`) means it's on the board, and `"error"` (with `message`) means fix the draft and send a new document. With no `status` yet, the board isn't open: open it (Artifact `action: "open"`), wait a moment and check again. The draft waits in the inbox until the board is opened.

Write good drafts: real copy and labels, few colours, one idea per screen, and `flows` for navigation between screens. Inside a `row`, give each field or button a `width` (or `"fill"` on one of them) so the row fits the frame.

**Before changing a board the user has edited,** read it first (see build-from-board for how), redraw only the frames you're asked about, and keep frame names stable, because `merge` matches frames by name. Never overwrite what the user drew unless they ask.

Reply in one or two lines: what you drew, the board's link, and that ⌘Z undoes the draft.

## Update a board to the latest editor

A board keeps the editor it was made with. To give it the current one (when the user asks, or a fix they want is in a newer editor), make sure the engine is current (above), then list the board's files (Artifact `action: "list"`, `scope: "files"`, its `url`), then publish its `index.html` again to that `url` with the same `files` map as above. Read `index.html` first with `action: "read"` and `path: "index.html"`, and publish that, unchanged. Its board and drafts are kept.
