#!/usr/bin/env sh
# Applies the branch and tag rulesets of .github/rulesets/ to the GitHub repository.
# Idempotent: a ruleset with the same name is updated, otherwise it is created.
# Requirements: GitHub CLI (gh) authenticated with administration rights on the repository.
#   sh tools/github/apply-rulesets.sh [owner/repository]
set -eu

repo="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"

for file in .github/rulesets/*.json; do
  name=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')).name)" "$file")
  id=$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$name\") | .id")
  if [ -n "$id" ]; then
    gh api --method PUT "repos/$repo/rulesets/$id" --input "$file" > /dev/null
    echo "Ruleset mis à jour : $name"
  else
    gh api --method POST "repos/$repo/rulesets" --input "$file" > /dev/null
    echo "Ruleset créé : $name"
  fi
done
