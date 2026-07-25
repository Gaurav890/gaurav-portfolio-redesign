# Non-goals

Explicitly list what is out of scope and why.

| ID | Non-goal | Reason |
|---|---|---|
| NG-001 | Rebuilding the professional Medium blog on this site | Medium stays external and is linked; this is a portfolio, not a full publishing-platform migration. A separate, lighter-weight personal/candid writing section ("Notes," FR-015) is in scope and is not the same thing — see FR-015. |
| NG-002 | Optimizing primarily for enterprise/consulting sales leads | Locked decision: primary audience is hiring managers/recruiters (P-001); enterprise prospects (P-002) are secondary and must not drive IA/visual decisions. |
| NG-003 | Multi-tenant or reusable "portfolio template" product | This is a bespoke, single-person brand site, not a product other people install or configure. |
| NG-004 | Generic gradient-heavy dashboard aesthetic | Explicitly rejected per `.claude/rules/frontend.md` anti-patterns and the chosen warm/narrative visual thesis. |
| NG-005 | A CMS/admin backend for editing content at runtime | Content is versioned in the repo unless a future ADR justifies a CMS; avoids premature infrastructure. |
| NG-006 | Multi-language/localization support | No stated audience need; English-only for this rebuild. |
| NG-007 | Native mobile app | Out of scope — this is a responsive web site, not an Expo/React Native deliverable. |
| NG-008 | Case studies section (AI fashion, real-estate SEO, HR SaaS traffic-growth) | Cut 2026-07-24 — Gaurav confirmed this section is "not helpful right now." Superseded by FR-014 (Events) and FR-015 (personal Notes) as the new content directions. |
