# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Privacy & Security (HIGHEST PRIORITY)**:
- [ ] All conversions that CAN be client-side ARE client-side
- [ ] Server-side processing justified and documented
- [ ] Privacy indicators visible to users
- [ ] HTTPS/TLS 1.3 minimum, AES-256 encryption for server uploads
- [ ] No file logging or third-party tracking

**User Experience**:
- [ ] Maximum 3 clicks from landing to conversion
- [ ] <100ms visual response for user actions
- [ ] Before/after preview for quality-affecting conversions
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Mobile-first responsive design (44px touch targets)

**Code Quality**:
- [ ] TypeScript strict mode, no `any` types
- [ ] Cyclomatic complexity ≤ 10 per function
- [ ] 80% test coverage overall, 100% for critical paths
- [ ] Lighthouse scores: Perf 90+, A11y 95+, BP 100, SEO 95+
- [ ] FCP <1.5s, TTI <3.5s

**Testing Standards**:
- [ ] Tests written BEFORE implementation (TDD)
- [ ] Unit, integration, and E2E tests planned
- [ ] Edge cases covered: file size limits, corrupt files, network failures
- [ ] Browser compatibility: Chrome, Firefox, Safari, Edge (latest 2 versions)

**Quality Assurance**:
- [ ] Original quality preservation as default
- [ ] File format support aligns with priority (Images → Documents → Audio/Archive)
- [ ] Free tier: 50MB/file, 5 batch, 150MB total
- [ ] Premium tier: 500MB/file, 25 batch, 5GB total
- [ ] No silent failures, clear error messages

**Performance Targets**:
- [ ] API response <200ms (p95)
- [ ] Client conversions <3s for 10MB image
- [ ] Server conversions <30s for 50MB file
- [ ] Bundle size: initial <200KB gzipped, routes <100KB gzipped

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
