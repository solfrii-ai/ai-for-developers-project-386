# AGENTS.md

## Product
- Build a simplified Cal.com-style service for scheduling and booking calls; do not target full Cal.com feature parity.

## Current state
- This is a greenfield repository with no application code or selected toolchain. The `README.md` setup and usage sections are placeholders.
- No install, development, build, lint, typecheck, or test commands are defined. Verify commands from newly added manifests and scripts instead of guessing.
- When introducing the stack, document exact setup, environment variables, startup, and verification commands in `README.md`; update this file with non-obvious workflows.

## Hexlet checks
- Do not edit, delete, or rename `.github/workflows/hexlet-check.yml`, and do not rename the repository. The generated workflow runs Hexlet checks on every push using the `HEXLET_ID` secret.
- Hexlet tests become available as project steps are completed; there is no repository-local test suite yet.

## Agent skills

### Issue tracker

Issues are tracked in `solfrii-ai/ai-for-developers-project-386` using GitHub Issues and the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Domain docs use a single-context layout: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.
