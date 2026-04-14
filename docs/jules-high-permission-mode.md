# Jules High Permission Mode

This repository is configured for aggressive Jules automation.

## What is enabled
- Auto-summon Jules on every issue event (open/reopen/edit/label).
- Auto-summon Jules on every PR event (open/reopen/ready/synchronize).
- Write-oriented workflow token permissions.

## Operational expectation
- Jules may create frequent automated comments and rapid follow-up changes.
- Human review is still recommended for auth, migrations, and large refactors.

## Repository settings applied via `gh api`
- Actions enabled with `allowed_actions=all`.
- Workflow token default permission set to `write`.
- Workflow token allowed to approve pull request reviews.

## Rollback
1. Disable workflow: `.github/workflows/jules-autopilot.yml`
2. Set workflow token permission back to `read` using `gh api`.
3. Re-enable branch protections and required reviews in repo settings.
