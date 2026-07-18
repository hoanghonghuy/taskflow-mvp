# OpenSpec — Synapse-native

Synapse OpenSpec layout and slash workflows for Cursor (and compatible IDEs).

## Layout

```
openspec/
  config.yaml           # schema + project rules
  specs/                # source of truth (by domain)
  schemas/              # workflow artifact definitions + templates
  changes/<id>/         # one folder per change
  changes/archive/      # completed changes
```

## Lifecycle

1. **explore** — `/opsx-explore` (ideas, no code)
2. **research** — `/opsx-research` (evidence)
3. **propose** — `/opsx-propose` → `openspec/changes/<id>/`
4. **verify-spec** — `/opsx-verify-spec` (artifact gate)
5. **apply** — `/opsx-apply` (implement with TDD)
6. **verify** — `/opsx-verify` (implementation gate)
7. **archive** — `/opsx-archive`

Supporting flows: `/opsx-brainstorm`, `/opsx-audit`, `/opsx-onboard` (each has a companion skill under `.cursor/skills/`), plus `continue` / `ff` / `sync`.

MCP (when stack is up): `openspec_router`, `openspec_propose`, `openspec_apply`, `openspec_verify`, `openspec_archive`.

## CLI

```bash
syn openspec init
syn openspec init --force
syn openspec init --commands-only
syn openspec verify <change-id> --step SpecsDraft
```
