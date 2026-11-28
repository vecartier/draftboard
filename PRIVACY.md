# Draftboard privacy

Draftboard collects nothing. It has no server, no analytics and no account of its own, and the plugin author receives no data from it.

What it stores, and where:

- **Your boards** are Claude artifacts in your own claude.ai account. Each board saves its content (shapes, text, images, comments) in that artifact's own storage on claude.ai. Anthropic's terms and privacy policy cover that storage. People you share a board with can view it.
- **Your editor link** is written to `~/.claude/draftboard/engine.json` on your computer: the link to your private Draftboard engine artifact and its version. Delete the file to forget it; the next `/draftboard` publishes a new engine.
- **Fonts**: an open board loads the Caveat font from Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), so your browser contacts Google when a board opens.

Nothing is kept for any set time by Draftboard itself: boards stay until you delete the artifacts, and the local file stays until you delete it or uninstall.

Draftboard is not aimed at people under 18.

Questions: open an issue at https://github.com/vecartier/draftboard/issues.
