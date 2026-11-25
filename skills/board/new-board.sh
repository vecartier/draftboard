#!/bin/bash
# Prepares a new Draftboard board page in one step.
# Usage: new-board.sh <folder to write into, e.g. your scratchpad> <board name>
# Prints: "ready <index.html path> <engine url>" when the engine is set up and current,
#         "engine-needed <reason>" when it must be set up first (see SKILL.md),
#         or "error <reason>".
set -u
OUT="${1:-}"
NAME="${2:-Untitled board}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RECORD="$HOME/.claude/draftboard/engine.json"
[ -n "$OUT" ] || { echo "error Give a folder to write into."; exit 1; }

WANT="$(tr -d '[:space:]' < "$HERE/engine/VERSION")"
[ -f "$RECORD" ] || { echo "engine-needed no engine yet"; exit 0; }
URL="$(sed -n 's/.*"url"[^"]*"\([^"]*\)".*/\1/p' "$RECORD")"
HAVE="$(sed -n 's/.*"version"[^"]*"\([^"]*\)".*/\1/p' "$RECORD")"
[ -n "$URL" ] || { echo "engine-needed engine.json has no url"; exit 0; }
# The engine is reused when it's the same version or newer.
NEWEST="$(printf '%s\n%s\n' "$WANT" "$HAVE" | sort -V | tail -1)"
[ "$NEWEST" = "$HAVE" ] || { echo "engine-needed engine $HAVE is older than $WANT"; exit 0; }

ID="$(uuidgen | tr '[:upper:]' '[:lower:]')"
DIR="$OUT/draftboard-$ID"
mkdir -p "$DIR"
# The name goes into HTML (escaped) and into a JSON string (escaped).
HTML_NAME="$(printf '%s' "$NAME" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g')"
JSON_NAME="$(printf '%s' "$NAME" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e 's/</\\u003c/g')"
export ID HTML_NAME JSON_NAME
perl -pe 's/\{\{BOARD_ID\}\}/$ENV{ID}/g; s/\{\{BOARD_NAME_JSON\}\}/$ENV{JSON_NAME}/g; s/\{\{BOARD_NAME\}\}/$ENV{HTML_NAME}/g' \
  "$HERE/board.html" > "$DIR/index.html"
echo "ready $DIR/index.html $URL"
