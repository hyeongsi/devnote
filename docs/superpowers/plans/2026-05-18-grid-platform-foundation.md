# Grid Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공통 Grid 플랫폼 전환의 첫 단계로 `src/features/grid/` 기반 폴더 구조와 최소 타입/유틸/스텁을 추가한다.

**Architecture:** 기존 관리자용 그리드를 바로 교체하지 않고, 재사용 가능한 Grid 전용 feature 경계를 먼저 만든다. 타입과 유틸은 현재 `AdminEditableGrid`의 편집 시나리오를 흡수할 수 있게 generic 중심으로 설계하고, 컴포넌트/훅은 이후 AG Grid 도입을 위한 최소 stub로 둔다.

**Tech Stack:** React 19, TypeScript, Vite, ESLint

---

### Task 1: Grid Foundation Files

**Files:**
- Create: `devnote/src/features/grid/types/gridTypes.ts`
- Create: `devnote/src/features/grid/utils/rowState.ts`
- Create: `devnote/src/features/grid/utils/columnFactory.ts`
- Create: `devnote/src/features/grid/utils/formatters.ts`
- Create: `devnote/src/features/grid/utils/validators.ts`
- Create: `devnote/src/features/grid/hooks/useGridState.ts`
- Create: `devnote/src/features/grid/components/BaseGrid.tsx`
- Create: `devnote/src/features/grid/components/GridEmptyState.tsx`
- Create: `devnote/src/features/grid/index.ts`

- [ ] **Step 1: 타입과 유틸 경계 정의**

`gridTypes.ts`에 공통 행 상태 타입, 컬럼 타입, 포맷터와 검증 함수 타입을 정의한다. `rowState.ts`에는 값 비교, dirty field 계산, row state 계산 유틸을 추가한다.

- [ ] **Step 2: 컬럼/포맷터/검증 유틸 추가**

`columnFactory.ts`, `formatters.ts`, `validators.ts`에 페이지 레벨 재사용을 위한 최소 helper를 구현한다.

- [ ] **Step 3: 컴포넌트/훅 최소 스텁 추가**

향후 AG Grid wrapper 구현 지점이 분명해지도록 `BaseGrid.tsx`, `GridEmptyState.tsx`, `useGridState.ts`의 최소 동작 스텁을 추가한다.

- [ ] **Step 4: 공개 export 정리**

`index.ts`에서 외부 소비용 export를 한곳으로 정리한다.

- [ ] **Step 5: 검증**

Run: `npm run build`
Expected: TypeScript build and Vite build complete successfully.

Run: `npm run lint`
Expected: ESLint completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/plans/2026-05-18-grid-platform-foundation.md devnote/src/features/grid
git commit -m "feat: 공통 그리드 기반 구조 추가"
```
