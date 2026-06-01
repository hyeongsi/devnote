# Grid Platform Foundation Design

## Goal

AG Grid 기반 공통 Grid 플랫폼으로 전환하기 전에, 현재 프로젝트에서 재사용 가능한 Grid 전용 폴더 구조와 최소 공통 타입/유틸 경계를 먼저 확립한다.

이번 단계에서는 실제 AG Grid 도입이나 관리자 화면 교체를 진행하지 않는다. 이후 단계에서 카테고리 관리와 메뉴 관리 화면을 안전하게 순차 전환할 수 있도록 기반만 만든다.

## Current Context

- 프런트엔드 프로젝트는 `D:/workspace/ai/devnote/devnote`에 위치한다.
- 관리자 화면은 현재 [`AdminEditableGrid`](D:/workspace/ai/devnote/devnote/src/features/admin/AdminEditableGrid.tsx) 중심으로 구성되어 있다.
- 카테고리 관리와 메뉴 관리는 각각 [`AdminCategoriesPage`](D:/workspace/ai/devnote/devnote/src/pages/admin/AdminCategoriesPage.tsx), [`AdminMenusPage`](D:/workspace/ai/devnote/devnote/src/pages/admin/AdminMenusPage.tsx)에서 같은 그리드 추상화를 사용 중이다.
- 아직 프로젝트에 AG Grid 의존성은 설치되어 있지 않다.

## Scope

### In Scope

- `src/features/grid/` 전용 폴더 구조 생성
- 공통 Grid 타입 정의 추가
- 행 상태 관리 유틸 추가
- 컬럼 정의 보조 유틸 추가
- 포맷터/검증 유틸의 최소 골격 추가
- 이후 단계에서 재사용할 수 있도록 `index.ts` export 정리

### Out of Scope

- AG Grid 패키지 설치
- `BaseGrid`의 실제 AG Grid 래핑 구현
- 카테고리 관리 화면 교체
- 메뉴 관리 화면 교체
- 기존 `AdminEditableGrid` 제거 또는 대규모 리팩터링

## Recommended Structure

```txt
devnote/src/features/grid/
  components/
    BaseGrid.tsx
    GridEmptyState.tsx
  hooks/
    useGridState.ts
  types/
    gridTypes.ts
  utils/
    columnFactory.ts
    formatters.ts
    rowState.ts
    validators.ts
  index.ts
```

## Responsibility Boundaries

### `types/gridTypes.ts`

- Grid 행 상태 타입 정의
- 공통 컬럼 메타 타입 정의
- 셀 포맷터/검증 함수 시그니처 정의
- 향후 AG Grid wrapper가 소비할 공통 인터페이스 제공

### `utils/rowState.ts`

- 신규/수정/삭제 상태 계산 함수 제공
- 원본과 현재값 비교용 공통 로직 제공
- 향후 편집 Grid와 서버 저장 diff 계산의 기반 역할 수행

### `utils/columnFactory.ts`

- 공통 컬럼 정의 생성 헬퍼 제공
- 페이지 단에서 컬럼 선언 문법을 단순화
- 추후 AG Grid `ColDef` 매핑 지점으로 확장 가능하게 설계

### `utils/formatters.ts`

- 문자열/숫자 기본 포맷터 제공
- 추후 통화, 날짜, 빈 값 처리 등으로 확장 가능한 위치 확보

### `utils/validators.ts`

- required, maxLength 같은 범용 검증 함수의 기본 형태 제공
- 페이지별 custom validation과 조합 가능한 구조 유지

### `components/`, `hooks/`

- 이번 단계에서는 실제 동작보다는 import 경로와 책임 경계를 고정하기 위한 최소 골격만 둔다.
- AG Grid 설치 이후 `BaseGrid`, `useGridState`에 실제 로직을 채운다.

## Approach Options Considered

### Option A: `src/features/grid/` 전용 feature 폴더 신설

- 장점: 현재 코드 구조와 가장 잘 맞고, 기존 admin 기능과 분리된 재사용 경계를 만들 수 있다.
- 단점: 초기에는 파일 수가 조금 늘어난다.

### Option B: `src/shared/grid/` 형태로 더 범용적인 shared 구조 도입

- 장점: 장기적으로 여러 도메인에서 재사용하기 좋다.
- 단점: 현재 코드베이스 규모에서는 다소 무겁고, 기존 구조와의 일관성이 약해질 수 있다.

### Option C: `src/features/admin/grid/`에서 시작

- 장점: 당장 관리자 화면 변경에는 가장 빠르다.
- 단점: “다른 프로젝트에서도 재사용 가능한 Grid 플랫폼”이라는 목표와 거리가 멀어진다.

### Decision

Option A를 채택한다. 현재 코드베이스의 `features` 중심 구조를 유지하면서도 관리자 도메인에 종속되지 않는 Grid 경계를 만들 수 있기 때문이다.

## Data and Type Direction

- 모든 공통 타입은 generic 기반으로 설계한다.
- 컬럼 타입은 `TItem`을 기준으로 `field` 자동완성이 가능해야 한다.
- 행 상태는 `'clean' | 'added' | 'modified' | 'deleted'`를 기본값으로 사용한다.
- 타입 설계는 현재 `AdminEditableGrid`가 이미 갖고 있는 편집 시나리오를 흡수할 수 있어야 한다.

## Migration Plan

1. 이번 단계에서 Grid 전용 폴더 구조와 공통 타입/유틸을 만든다.
2. 다음 단계에서 AG Grid를 설치하고 `BaseGrid` 최소 래퍼를 구현한다.
3. 그 다음 단계에서 카테고리 관리 화면을 새 Grid 기반으로 먼저 전환한다.
4. 카테고리 전환이 안정화되면 메뉴 관리 화면을 같은 방식으로 전환한다.

## Testing Direction

- 이번 단계는 동작 변경보다 구조 정리에 가깝기 때문에, 우선 TypeScript 빌드와 lint 통과를 기준으로 검증한다.
- 이후 실제 Grid 교체 단계부터는 화면 동작 검증이 필요하다.

## Risks and Mitigations

- 위험: 너무 이른 추상화로 실제 페이지 요구사항과 어긋날 수 있다.
  대응: 이번 단계는 최소 타입/유틸 골격만 만들고, 실제 동작 추상화는 카테고리 화면 전환 시점에 검증하며 확장한다.

- 위험: 기존 `AdminEditableGrid`의 책임을 한 번에 옮기려다 범위가 커질 수 있다.
  대응: 카테고리 화면 하나를 먼저 전환하는 점진적 마이그레이션을 유지한다.

- 위험: AG Grid 도입 전 placeholder 컴포넌트가 불필요하게 커질 수 있다.
  대응: `components/`와 `hooks/`는 최소 stub만 만들고, 실제 구현은 다음 단계로 미룬다.
