# AGENTS.md

## Product
- Build a simplified Cal.com-style service for scheduling and booking calls; do not target full Cal.com feature parity.

## UI sketches
- When building or changing a screen, read [docs/design/README.md](docs/design/README.md) and open the PNGs it names. Those sketches are the visual reference; product rules stay in [README.md](README.md).

## Learning workflow
- This is an educational project. At every substantial step, stop before acting and explain why the step is needed and what it will accomplish; proceed only after the user's confirmation.

## Contributing
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) when contributing to this repository.

## Current state
- The pnpm workspace contains two apps: a React + Vite + TypeScript frontend in `apps/frontend` and a Node.js + Express backend in `apps/backend`. The stack is documented in `docs/adr/0002-technology-stack.md`.
- Run `mise install` and `pnpm install` from the root. Dependencies stay in one shared `pnpm-lock.yaml`. Use `pnpm dev` to start both apps in parallel through pnpm, with no orchestrator package. The backend listens on port `3000`; Vite proxies `/api` to that port. Use `pnpm lint`, `pnpm test`, and `pnpm build` to check both apps, and `mise run check` to lint the OpenCode workflows. No environment variables are required.
- The root `Dockerfile` builds a self-starting production container. The process reads `PORT` (default `3000`) and serves both the built frontend and `/api`. See `docs/adr/0003-production-container.md`.
- OpenCode runs from `/opencode` comments through `.github/workflows/opencode.yml`; its security exception is documented in `docs/adr/0001-opencode-via-github-actions.md`.
- See `README.md` for setup, startup, and verification details; update it and this file when workflows change.

## Hexlet checks
- Do not edit, delete, or rename `.github/workflows/hexlet-check.yml`, and do not rename the repository. The generated workflow runs Hexlet checks on every push using the `HEXLET_ID` secret.
- Hexlet tests become available as project steps are completed; repository-local frontend and backend tests run through `pnpm test`.

## Agent skills

### Issue tracker

Issues are tracked in `solfrii-ai/ai-for-developers-project-386` using GitHub Issues and the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Domain docs use a single-context layout: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.

### Research

Web research follows `docs/agents/research.md`. When dispatching a research subagent, pass that file in its prompt.
