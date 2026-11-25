#!/bin/bash
# Helps set up the person's private engine artifact without Claude (used by the plugin's /draftboard command).
# Usage: engine-files.sh copy <folder>      prints "files <folder>/engine <version> <current engine url or ->"
#        engine-files.sh record <url> <version>   writes ~/.claude/draftboard/engine.json, prints "recorded"
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECORD="$HOME/.claude/draftboard/engine.json"
case "${1:-}" in
  copy)
    OUT="${2:-}"
    [ -n "$OUT" ] || { echo "error Give a folder to copy into."; exit 1; }
    DIR="$OUT/draftboard-engine-$(uuidgen | tr '[:upper:]' '[:lower:]')"
    mkdir -p "$DIR" && cp "$HERE/engine/index.html" "$HERE/engine/draftboard.js" "$HERE/engine/draftboard.css" "$DIR/" || { echo "error Copying the editor failed."; exit 1; }
    URL="-"
    [ -f "$RECORD" ] && URL="$(sed -n 's/.*"url"[^"]*"\([^"]*\)".*/\1/p' "$RECORD")"
    echo "files $DIR $(tr -d '[:space:]' < "$HERE/engine/VERSION") ${URL:--}"
    ;;
  record)
    [ -n "${2:-}" ] && [ -n "${3:-}" ] || { echo "error Give the url and version."; exit 1; }
    mkdir -p "$(dirname "$RECORD")" && printf '{"url": "%s", "version": "%s"}\n' "$2" "$3" > "$RECORD" && echo "recorded"
    ;;
  *) echo "error Unknown mode."; exit 1 ;;
esac
