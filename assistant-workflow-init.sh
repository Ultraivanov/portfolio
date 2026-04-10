#!/usr/bin/env bash
set -euo pipefail

PROFILE="${1:-}"

if [[ -z "$PROFILE" ]]; then
  echo "Select project profile: software or content"
  read -r PROFILE
fi

case "$PROFILE" in
  software|content)
    ;;
  *)
    echo "Invalid profile: $PROFILE"
    echo "Use 'software' or 'content'."
    exit 1
    ;;
esac

mkdir -p .assistant/commands .assistant/contracts .assistant/templates .assistant/protocols

if [[ "$PROFILE" == "content" ]]; then
  mkdir -p .assistant/content
  touch .assistant/content/SNAPSHOT.md .assistant/content/BACKLOG.md .assistant/content/ARCHITECTURE.md
else
  touch .assistant/SNAPSHOT.md .assistant/BACKLOG.md .assistant/ARCHITECTURE.md
fi

echo "profile=$PROFILE" > .assistant/.framework-config

echo "Assistant Workflow Starter initialized with profile: $PROFILE"
