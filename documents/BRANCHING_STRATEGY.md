# Branching Strategy

Trunk-based development with release tags.

## Principles

- One long-lived branch: `main`.
- Work happens on short-lived branches and lands through pull requests.
- Merging to `main` makes a commit a release candidate. Only a version tag creates a release.
- Unfinished work is hidden behind a feature flag, not a long-lived branch.

```
main ── feat A ── feat B ── fix C ── feat D ──►
                    │          │          │
                 v0.2.0     v0.2.1     v0.3.0
```

## Branch names

| Purpose      | Pattern                       | Example                 |
| ------------ | ----------------------------- | ----------------------- |
| Feature      | `feature/<short-name>`        | `feature/mark-all-read` |
| Bug fix      | `fix/<short-name>`            | `fix/kafka-reconnect`   |
| Hotfix       | `hotfix/<short-name>`         | `hotfix/login-crash`    |
| Chore / docs | `chore/<name>`, `docs/<name>` | `docs/readme`           |

Always branch from `main` and delete the branch after merge.

## Workflow

```bash
git checkout -b feature/add-cache main
git commit -m "feat(cache): add cache service"   # Conventional Commits
# open a PR → CI passes → merge to main
```

PR requirements: CI passes (lint, test, build) and `main` is protected, so it only accepts changes through a PR.

## Versioning

Semantic versioning (`MAJOR.MINOR.PATCH`):

| Bump  | When                                            | Example           |
| ----- | ----------------------------------------------- | ----------------- |
| patch | Bug fix, backward compatible                    | `0.5.0` → `0.5.1` |
| minor | New feature (before 1.0, also breaking changes) | `0.5.x` → `0.6.0` |
| major | Breaking change (after 1.0)                     | `1.0.0` → `2.0.0` |

## Releasing

`release-it` bumps the version, commits, tags and pushes:

```bash
npm run release              # interactive
npm run release -- --patch
npm run release -- --minor
npm run release -- --major
```

A GitHub Actions workflow triggered by the `v*` tag builds the project and creates the GitHub release. Release from `main` only, never from a feature branch.

## Hotfix

```bash
git checkout -b hotfix/fix-crash main
git commit -m "fix: resolve crash on login"
# PR → merge to main
npm run release -- --patch
```

Branch from `main`, not from an old tag, so `main` stays the single source of truth.

## Feature flags

Use [OpenFeature](https://openfeature.dev/) to merge unfinished or risky work safely.

| Situation                                   | Use a flag? |
| ------------------------------------------- | ----------- |
| Feature is unfinished but you want to merge | Yes         |
| Feature is done but should not be live yet  | Yes         |
| Ordinary bug fix                            | No          |
| Refactor with no behavior change            | No          |

```typescript
const enabled = await this.featureFlags.getBooleanValue('enable-new-flow', false);

return enabled ? this.newFlow(data) : this.legacyFlow(data);
```

Lifecycle: merge with the flag off → turn it on in a test environment → enable in production → remove the flag and the old code once stable.
