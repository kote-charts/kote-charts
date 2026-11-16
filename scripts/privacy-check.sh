#!/usr/bin/env bash
# Pre-push gate: no personal names, no data-provider names, no private paths,
# and only the brand identity in commit metadata. Run: bash scripts/privacy-check.sh
set -euo pipefail
cd "$(dirname "$0")/.."
fail=0
PERSONAL='spivak|konstantin|константин|спивак'
VENDORS='blockchain\.info|coin ?gecko|defillama|coin ?metrics|farside|theblock|coinmarketcap|alternative\.me|twelve ?data|alpha ?vantage|frankfurter|arkham|bitinfo'
PRIVATE='/Users/|kote-anal($|[^a-z])|192\.168\.|rocken|\.env\.production|srv/kote'
FILES=$(git ls-files 2>/dev/null || find . -type f -not -path './.git/*' -not -path '*/node_modules/*')
# This script names the patterns it bans — exclude it from its own scan.
FILES=$(printf '%s\n' "$FILES" | grep -v '^scripts/privacy-check.sh$' | grep -v 'package-lock.json$' || true)
for pat in "$PERSONAL" "$VENDORS" "$PRIVATE"; do
  if hits=$(printf '%s\n' "$FILES" | xargs grep -nIiE "$pat" 2>/dev/null); then
    echo "✖ forbidden pattern /$pat/:"; echo "$hits" | head -20; fail=1
  fi
done
if git rev-parse --git-dir >/dev/null 2>&1 && git log -1 >/dev/null 2>&1; then
  if git log --format='%an <%ae>%n%cn <%ce>' | grep -viE '^Kote Charts <[0-9]+\+kotecharts@users\.noreply\.github\.com>$' | grep -q .; then
    echo '✖ commit author/committer is not the brand identity:'; git log --format='%h %an <%ae> / %cn <%ce>' | head; fail=1
  fi
  if git log --format='%B' | grep -qiE "$PERSONAL"; then echo '✖ personal name in a commit message'; fail=1; fi
fi
[ "$fail" = 0 ] && echo '✓ privacy check passed'
exit "$fail"
