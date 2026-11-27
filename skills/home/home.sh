#!/bin/bash
# Draftboard home: one private artifact that lists the person's boards (see SKILL.md).
# Usage: home.sh url                 prints "home <url>" or "none"
#        home.sh page <folder>       copies the home page into a new folder, prints "page <path>"
#        home.sh record <url>        writes ~/.claude/draftboard/home.json, prints "recorded"
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECORD="$HOME/.claude/draftboard/home.json"
case "${1:-}" in
  url)
    URL=""
    [ -f "$RECORD" ] && URL="$(sed -n 's/.*"url"[^"]*"\([^"]*\)".*/\1/p' "$RECORD")"
    if [ -n "$URL" ]; then echo "home $URL"; else echo "none"; fi
    ;;
  page)
    OUT="${2:-}"
    [ -n "$OUT" ] || { echo "error Give a folder to copy into."; exit 1; }
    DIR="$OUT/draftboard-home-$(uuidgen | tr '[:upper:]' '[:lower:]')"
    mkdir -p "$DIR" && cp "$HERE/home.html" "$DIR/index.html" || { echo "error Copying the home page failed."; exit 1; }
    echo "page $DIR/index.html"
    ;;
  record)
    [ -n "${2:-}" ] || { echo "error Give the url."; exit 1; }
    mkdir -p "$(dirname "$RECORD")" && printf '{"url": "%s"}\n' "$2" > "$RECORD" && echo "recorded"
    ;;
  *) echo "error Unknown mode."; exit 1 ;;
esac
