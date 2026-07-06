# custom/docs/HARNESS.md — project notes for docs/HARNESS.md

Customization overlay for `.harness/docs/HARNESS.md`. Record project-specific harness-design notes,
deviations, or extra context here; harness upgrades never touch this file. (See `.harness/custom/CLAUDE.md`.)

<!-- Add your project-specific notes here. -->

---

# Project notes — ryankrol.co.uk

This install is the **in-place variant** localized to this repo: a Next.js pages-router JS site on
DynamoDB/Vercel (no TypeScript), ported originally from the owner's `local-jobs` project.

**Why in-place (not worktree) here:** the harness's own private, untracked state lives in this one
checkout — the gitignored ideas inbox (`.harness/tracking/IDEAS.md`), `.harness/perfume-seed-data.tsv`,
and local `.env.local` — so an in-place loop reads them with no worktree-setup overhead. Safety = git
itself: each task is one commit on `main`, a bad one is a one-line `git revert`, Vercel redeploys.

**Push cooldown (Vercel Hobby-tier pacing):** `PUSH_COOLDOWN_SECONDS` (`config/harness.env`) paces
integration pushes so a rapid multi-task burst can't trip Vercel's build rate limit. Currently **0**
(disabled) — Vercel's Git integration is disconnected. See the dated **2026-07-02** incident in
`custom/CLAUDE.md` for why it exists; restore it to `300` if deploy-on-push is ever reconnected.

**Deploy:** happens via the `on-drained` lifecycle hook (`custom/hooks/on-drained.sh`), not a backlog
task — see the "Deployment is fully automatic" section in `custom/CLAUDE.md`.
