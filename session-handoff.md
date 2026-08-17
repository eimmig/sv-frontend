# Session Handoff — web

## Current Objective

- Goal: bootstrap the web app harness.
- Current status: harness created, no code yet.
- Branch / commit: (not committed yet)

## Completed This Session

- [x] Created `CLAUDE.md`, `feature_list.json`, `init.sh`, `progress.md`, `session-handoff.md`.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Build/test | `./init.sh` | not run yet | No package.json yet (feat-001). |

## Files Changed

- All files in this directory — created.

## Decisions Made

- None specific to this session — state management (Signals, not NgRx) and standalone
  components were already decided project-wide in `../../docs/CONVENTIONS.md`, not reopened per
  session.

## Blockers / Risks

- Real integration needs `auth-service` and `bets-service` endpoints to exist.

## Next Session Startup

1. Read `../../CLAUDE.md` and `../../docs/services/web.md`.
2. Read this directory's `CLAUDE.md`, `feature_list.json`, `progress.md`.
3. Run `./init.sh`.

## Recommended Next Step

- Start `feat-001` (Angular project setup).
