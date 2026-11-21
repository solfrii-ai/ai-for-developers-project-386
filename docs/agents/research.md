# Research

Fetch rules for web research in this repo. The locked `research` skill is not edited; these rules sit beside it.

## When dispatching

Pass this file in the research subagent's prompt. The subagent follows it while fetching.

## Fetch cheaply

- Prefer a narrow documentation page, a raw README, or another markdown source. Fetch rendered HTML only when no markdown source exists.
- Do not fetch a URL already fetched in this session. Reuse the prior result.
- List the facts still missing before the next fetch. Stop when each required fact has a primary-source citation.
