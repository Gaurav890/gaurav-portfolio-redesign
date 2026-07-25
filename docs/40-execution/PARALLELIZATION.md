# Parallelization plan

Source: `docs/40-execution/TASKS.jsonl` (35 tasks, decomposed 2026-07-24 from `docs/10-product/PRD.md` and `docs/30-engineering/ADR/001-web-stack-and-voice-agent-provider.md` as amended).

## Dependency DAG

```text
T-001 (scaffold) ──┬── T-010 Hero
                    ├── T-011 About ──────────────┐
                    ├── T-012 Experience ──────────┤
                    ├── T-013 Projects ────────────┤── T-033 Knowledge base
                    ├── T-014 Events               │
                    ├── T-015 Education/Achieve.    │
                    ├── T-016 Contact actions       │
                    ├── T-017 Notes list+detail ────┼── T-018 RSS
                    │                               │         └── T-019 SEO ─────────────┐
                    ├── T-050 Analytics             │                                     │
                    └── T-037 Agent shell/text ──┐  │                                     │
                                                  │  │                                     │
T-002 (Supabase base) ──┬── T-020 /api/contact ──┼──┼── T-021 Contact form UI              │
                          ├── T-023 Comments BE ──┼──┼── T-024 Comments UI                  │
                          └── T-030 Agent schema ──┼──┼── T-031 /api/agent/session           │
                                                    │  │        └── T-038 Voice mode UI      │
                                                    │  │── T-032 /api/agent/turn (needs T-033)│
                                                    │  │        └── T-034 Guardrail classifier│
                                                    │  │── T-035 session/end                 │
                                                    │  │        └── T-036 Cost throttle       │
T-003 (env scaffolding) ──┴────────────────────────┘  │                                     │
                                                        │                                     │
T-039 (ElevenLabs stock voice, no code dep) ───────────┘                                     │
                                                                                               │
T-022 (Vercel Firewall config) ← depends on T-020, T-031, T-032                               │
                                                                                               │
T-060 Security gate: contact ← T-020, T-021, T-023, T-024                                     │
T-061 Security gate: voice agent ← T-034, T-036, T-038 ─────────────────────────────────────┐│
                                                                                              ││
T-070 Responsive/a11y ← all content + form + agent UI tasks                                  ││
T-071 Full AC walkthrough ← T-060, T-061, T-070 ─────────────────────────────────────────────┘│
T-072 Performance ← T-010, T-013, T-017, T-037, T-050                                          │
T-080 Launch readiness ← T-071, T-072 ─────────────────────────────────────────────────────────┘
```

Three largely independent tracks can run in parallel once `T-001`/`T-002`/`T-003` land:

- **Content track** (frontend): T-010 through T-019, T-050 — no shared mutable state, each owns a distinct component directory.
- **Contact-form track** (backend → frontend): T-020/T-021, T-023/T-024.
- **Voice-agent track** (backend → frontend, highest risk): T-030 → T-031/T-032/T-035 → T-033/T-034/T-036 → T-037/T-038/T-039.

Security (T-060/T-061), QA (T-070/T-071/T-072), and launch (T-080) are strictly sequential gates after their dependencies land — never start early on a mocked/incomplete implementation.

## File ownership

| Task | Agent | Files/modules owned | Shared state touched | Parallel-safe? |
|---|---|---|---|---|
| T-001 | frontend | `apps/web/**` (shell only) | none | Yes — first task, nothing else starts before it lands |
| T-002 | backend | `packages/database/**`, `DATA_MODEL.md` | Supabase project | Yes, parallel with T-001 |
| T-003 | backend | `.env.example`, `DEVELOPER_COMMANDS.md` | none | Yes, parallel with T-001/T-002 |
| T-010–T-019, T-050 | frontend | distinct `apps/web/components/*/**` or `apps/web/app/**` subdirectories | none (no two tasks touch the same directory) | Yes, all parallel-safe after T-001 |
| T-020, T-023, T-030, T-031, T-032, T-035, T-036 | backend | distinct `apps/web/app/api/*/**` or `apps/web/lib/agent/*/**` subdirectories | Supabase schema (sequenced via T-002/T-030 first) | Partially — T-020/T-023 parallel-safe with each other and with the voice-agent track; within the voice-agent track, T-031/T-032/T-035 touch different route handlers but T-032 depends on T-033 (knowledge base) and feeds T-034 (guardrail) sequentially |
| T-021, T-024, T-037, T-038 | frontend | distinct `apps/web/components/*/**` subdirectories | none | Yes, parallel with each other once their backend dependency lands |
| T-033 | backend | `apps/web/lib/agent/knowledge-base/**` | reads content from T-011/T-012/T-013 (read-only) | Yes, once content tasks land |
| T-034 | backend (+ security co-review) | `apps/web/lib/agent/guardrails/**` | none | No — must complete before T-032 is considered done and before T-061 starts |
| T-039 | backend | none (account config) | ElevenLabs account | Yes, no file conflicts |
| T-022 | backend | none (Vercel platform config) | Vercel project settings | No — must happen after T-020/T-031/T-032 exist, single owner |
| T-060, T-061 | security | `docs/30-engineering/SECURITY_MODEL.md` | none | No — sequential gates, single reviewer at a time |
| T-070, T-071, T-072 | qa-evaluator | verification output only, `ACCEPTANCE_CRITERIA.md` for T-071 | none | No — sequential gates after implementation and security |
| T-080 | orchestrator | `CURRENT_STATE.md` | production DNS/domain (human-approval gated) | No — final task |

No two in-flight tasks ever own the same file/module concurrently; where tasks share a directory tree (e.g. `apps/web/lib/agent/**`), ownership is split by leaf subdirectory (`knowledge-base/`, `guardrails/`, `cost-throttle/`) so T-033/T-034/T-036 can proceed independently once their upstream dependency lands.

## Worktree plan

Use `./scripts/create-worktree.sh <TASK-ID> <slug>` for each task above `T-001`/`T-002`/`T-003` once those land on `main`. Recommended grouping to avoid excessive worktree churn:

| Task group | Worktree | Branch prefix |
|---|---|---|
| T-010–T-019, T-050 (content track) | one worktree per task, or batched 2-3 at a time if the same agent works them sequentially | `feat/T-0XX-<slug>` |
| T-020/T-021, T-023/T-024 (contact + comments) | one worktree per backend/frontend pair | `feat/T-02X-<slug>` |
| T-030–T-039 (voice agent) | one worktree per task given the risk level — do not batch high-risk voice-agent tasks together | `feat/T-03X-<slug>` |
| T-060, T-061 (security) | no worktree needed — review-only, runs against merged code on a review branch | `agent/T-06X-security-review` |

## Verification gates

1. Each task's own `verification` list in `TASKS.jsonl` must pass before its PR is marked ready.
2. `T-060` (contact-form security gate) blocks merging T-020/T-021/T-023/T-024 to `main` if any high-severity finding is open.
3. `T-061` (voice-agent security gate) blocks merging T-034/T-036/T-038 to `main` if the adversarial test script (AC-015) fails — this is the project's single hardest gate per the PRD's own risk framing of FR-013.
4. `T-070`/`T-071`/`T-072` block `T-080` (launch readiness) entirely.
5. Production cutover inside `T-080` requires explicit human approval per `.claude/rules/security.md` — no task in this graph performs it unilaterally.

## PR strategy

- Draft PRs open early for any task touching a shared contract (the Supabase schema in T-002/T-030, the `/api/agent/*` route shapes in T-031/T-032/T-035) so dependent tasks can review the interface before their own implementation is complete.
- Every PR links its task ID, requirement IDs, and acceptance-criteria IDs per `.claude/rules/git-workflow.md`.
- Squash merge by default; delete branches after merge.
- `T-034` (guardrail classifier) and `T-038` (voice mode) require the `security` agent as a required reviewer, not just an optional one, given their risk level.

## Integration order

1. `T-001`, `T-002`, `T-003` (foundation) — merge first, in any order relative to each other.
2. Content track (`T-010`–`T-019`, `T-050`) and the two backend tracks (`T-020`–`T-024`, `T-030`–`T-039`) proceed in parallel; each pulls latest `main` before opening its PR.
3. `T-022` (Firewall config) after its three dependencies merge.
4. `T-060` after the contact/comments track merges; `T-061` after the full voice-agent track merges.
5. `T-070` → `T-071` → `T-072` → `T-080`, strictly in that order, each rebasing on the latest `main`.

Do not mark any task `done` until its PR is merged into `main`, per `.claude/rules/git-workflow.md` and this repo's Definition of Done.
