---
name: home
description: Draftboard home, one private artifact that shows all of the person's Draftboard boards as a grid to open, find and hide, installable as a Mac or Windows app. Opens it (making it the first time), and syncs it with the boards that exist (adds missing ones, refreshes names and pictures). Use when the user types /draftboard:home, asks for their boards list, "all my boards", the Draftboard home or app, or asks to sync or refresh it.
argument-hint: "[sync]"
---

# Draftboard home

An artifact page can't list the person's other artifacts by itself, so Draftboard home keeps its own list of boards in its database, and Claude fills it: the plugin adds each new board as it's made, and a sync adds the rest. The page lets the person open, find, rename (on home only), hide and add boards by link.

Its link is kept in `~/.claude/draftboard/home.json`. `home.sh` (next to this file) reads and writes that record and copies the page.

The request is `$ARGUMENTS`.

## Open home (and make it the first time)

1. `bash "<this skill's folder>/home.sh" url` prints `home <url>` or `none`.
2. With a url: open it (Artifact `action: "open"`). Done, unless the request asks for a sync.
3. With `none`: `bash "<this skill's folder>/home.sh" page "<your scratchpad folder>"` prints `page <index.html>`. Publish it with the Artifact tool, a new artifact: `file_path` that index.html, `icon` `"grid"`, `description` "All your Draftboard boards in one place.", `capabilities` `{"db": {"rules": [{"path": "boards", "read": "admin", "write": "admin"}]}, "user": {}, "assets": {}, "desktop": {}}`. Then `bash "<this skill's folder>/home.sh" record <url>`, and sync (below) so it isn't empty.
4. Tell the person in one or two lines: it's open, and they can install it as an app from the artifact's menu in the Claude desktop app ("Install as app"), or from the Install button on the page.

## Sync

Brings home up to date with the boards that exist. Do it the first time, and when asked.

1. List the person's artifacts (Artifact `action: "list"`, `limit` 200, page through with `page_token`). Boards are the artifacts with `draftboard.js` in their files that aren't named "Draftboard engine" or "Draftboard". Titles like a board's ("Untitled board", "Untitled flow chart", or any name the person gave) are a strong hint; when unsure, list the artifact's files (`scope: "files"`).
2. Read home's list: ArtifactData `action: "list"`, `collection: "boards"`, on home's url.
3. For each board, read its own `board` collection (ArtifactData `action: "list"`, `collection: "board"`, with `out_dir` in your scratchpad: the documents are large). In `handoff.<id>` (not the `~1` parts) take `name`, `updated` and `png.assetId`. A board with no `handoff` document has never been edited: use its listing title and date, and no picture.
4. For a picture that's new or changed, copy it into home: Artifact `action: "publish"`, `url` home, `asset: true`, `from_url` the board, `asset_ids` [that png id]. The result gives the copy's `/_blob/<id>` url.
5. Write home's rows in one ArtifactData `batch`, doc_id = the board's artifact id (the last part of its URL): `{"url", "title", "created", "updated", "thumb": {"assetId", "url"}}`. Use `set` for a new row and `update` (with `if_version`) for an existing one, and never overwrite `hidden` or `alias`, which the person sets on the page. Boards that are empty "Untitled board"s nobody touched can go in with `"hidden": true`, so home opens on real work.
6. Reply in one line: how many boards home shows, and its link.

A board the person deleted stays on home until they hide it; leave such rows alone.
