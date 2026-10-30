#!/usr/bin/env sh
# Repository settings as code (idempotent): merge strategy, security features, Actions permissions,
# deployment environments, solo-maintainer variable, then branch and tag rulesets.
# Procedure: docs/engineering/REPOSITORY_SETUP.md. Requirements: GitHub CLI (gh) with admin rights.
#   sh tools/github/configure-repository.sh [owner/repository]
set -eu

repo="${1:-$(gh repo view --json nameWithOwner --jq .nameWithOwner)}"
echo "Dépôt : $repo"

# Squash merge only; the PR title and body become the commit on main; merged branches are deleted.
gh api --method PATCH "repos/$repo" \
  -F allow_squash_merge=true -F allow_merge_commit=false -F allow_rebase_merge=false \
  -F delete_branch_on_merge=true -F allow_update_branch=true \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY > /dev/null
echo "✔ Merge : squash uniquement, branches supprimées après merge"

# Security: private vulnerability reporting (SECURITY.md), secret scanning with push protection.
gh api --method PUT "repos/$repo/private-vulnerability-reporting" > /dev/null
echo "✔ Signalement privé de vulnérabilités"
if gh api --method PATCH "repos/$repo" \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled' > /dev/null 2>&1; then
  echo "✔ Secret scanning et push protection"
else
  echo "⚠ Secret scanning indisponible (dépôt privé sans GitHub Secret Protection) ; secretlint reste actif"
fi

# GitHub Actions: read-only token by default; workflows never approve pull requests.
gh api --method PUT "repos/$repo/actions/permissions/workflow" \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=false > /dev/null
echo "✔ Actions : jeton en lecture seule par défaut"

# Deployment environments: npm publishes from main and release/*, documentation from main only.
for environment in npm github-pages; do
  gh api --method PUT "repos/$repo/environments/$environment" \
    -F 'deployment_branch_policy[protected_branches]=false' \
    -F 'deployment_branch_policy[custom_branch_policies]=true' > /dev/null
done
add_branch_policy() {
  # Fails harmlessly when the policy already exists.
  gh api --method POST "repos/$repo/environments/$1/deployment-branch-policies" \
    -f name="$2" -f type=branch > /dev/null 2>&1 || true
}
add_branch_policy npm main
add_branch_policy npm 'release/*'
add_branch_policy github-pages main
echo "✔ Environnements npm et github-pages"

# Single maintainer: nobody else can approve a breaking change (GIT_WORKFLOW.md §10.2).
approvals="${BREAKING_CHANGE_APPROVALS:-0}"
gh variable set BREAKING_CHANGE_APPROVALS --repo "$repo" --body "$approvals"
echo "✔ Variable BREAKING_CHANGE_APPROVALS=$approvals"

sh "$(dirname "$0")/apply-rulesets.sh" "$repo"
