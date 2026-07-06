# .harness/custom/README.md — project notes for the harness README

Customization overlay for `.harness/README.md`. Add project-specific notes here; harness upgrades never
touch this file. (See `.harness/custom/CLAUDE.md` for how the overlay works.)

<!-- Add your project-specific notes here. -->

---

# Project notes — ryankrol.co.uk

- **Definition of Done:** `npm run lint && npm test && npm run build` — a Next.js pages-router
  JavaScript app (ESLint flat config + `eslint-config-next`; Jest via `next/jest`; no TypeScript
  typecheck). Set in `config/harness.env` (`LOCAL_DOD`) and mirrored in `.github/workflows/ci.yml`.
- **Requirements:** `jq`, `gh` (authenticated), Node 22.
- **Dashboard:** `npm run harness:dashboard` → http://localhost:4790.
- **Deploy:** on backlog drain, `custom/hooks/on-drained.sh` runs `vercel --prod` if `src`/`public`
  changed since `custom/last-deploy.json` (Vercel Git integration is disconnected — see root
  `CLAUDE.md` "Deploying").
