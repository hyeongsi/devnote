# Admin CRUD List Refactoring Notes

## 현재 문제점 분석

- `EntityList.tsx`가 데이터 상태 연결, 삭제 확인, 저장 처리, 데스크톱 테이블, 모바일 카드, 상태 배지, 필드 에디터 렌더링을 모두 담당하고 있었다.
- 행 상태(`added`, `modified`, `deleted`, `clean`)의 라벨과 Tailwind 클래스가 컴포넌트 내부 함수로 흩어져 있어 재사용이 어려웠다.
- 컬럼 타입 가드와 UI 표현 규칙이 화면 컴포넌트에 섞여 있어, 다른 Admin CRUD 화면에서 같은 패턴을 가져다 쓰기 불편했다.
- `usePagination`은 reset 처리를 effect 기반으로 수행해 React Hooks 린트 규칙에 걸렸고, 상태 보정 로직이 렌더 결과와 분리되어 있었다.
- `FeedbackProvider`는 provider 컴포넌트와 hook을 같은 파일에서 export해 Fast Refresh 린트 규칙에 걸렸다.

## 개선 방향

- `useEntityList`는 Container 역할로 유지하고, UI는 작은 Presentational 컴포넌트로 분리했다.
- 행 상태 표현, 컬럼 타입 가드처럼 반복될 수 있는 로직은 `utils`로 이동했다.
- 테이블과 모바일 카드는 같은 필드 렌더러(`EntityListField`)를 공유하도록 구성했다.
- 페이지별 파일(`AdminMenusPage`, `AdminCategoriesPage`)은 컬럼 정의, API 연결, 도메인 검증만 갖도록 유지했다.
- `usePagination`은 effect 없이 `resetKey` 기반으로 현재 페이지를 계산해 불필요한 상태 동기화를 제거했다.

## 리팩토링 구조

```txt
devnote/src/features/list/
  components/
    EntityList.tsx
    EntityListField.tsx
    EntityListMobileCards.tsx
    EntityListStateBlock.tsx
    EntityListStatusBadge.tsx
    EntityListSummary.tsx
    EntityListTable.tsx
    EntityListToolbar.tsx
  hooks/
    useEntityList.ts
  types/
    entityListTypes.ts
  utils/
    entityListColumns.ts
    entityListPresentation.ts
    entityListUtils.ts
```

## 분리 기준

- Component: 실제 화면 조각과 interaction UI를 담당한다. 예: Toolbar, Table, MobileCards, StatusBadge.
- Hook: fetch, save, row state, validation, dirty state처럼 화면과 독립적인 상태 흐름을 담당한다.
- Util: 순수 계산과 타입 가드, 상태 표현 매핑을 담당한다.
- Page: API 함수 연결, 컬럼 정의, 도메인별 검증만 담당한다.

## 타입 설계 방향

- `EntityListProps<TItem>`로 행 타입을 제네릭화해 Menu, Category 외 CRUD 화면도 같은 리스트 컴포넌트를 사용할 수 있게 했다.
- `EntityListFieldColumn<TItem, TField>`가 실제 필드 키와 값 타입을 연결하므로 editor/render/update에서 타입 추론이 유지된다.
- `EntityListChangeSet<TItem>`로 added/modified/deleted를 명확히 구분해 저장 API가 필요하면 변경 묶음을 활용할 수 있다.

## Before / After

Before:

```tsx
// EntityList.tsx 내부에 상태 배지, 데스크톱 테이블, 모바일 카드, 필드 에디터가 모두 존재
function renderField(row, column, isEditing) {
  // switch/select/input/render 처리
}
```

After:

```tsx
<EntityListToolbar ... />
<EntityListTable ... />
<EntityListMobileCards ... />
<EntityListSummary ... />
```

필드 렌더링은 `EntityListField`가 공통 담당한다.

```tsx
<EntityListField
  row={row}
  column={column}
  isEditing={isEditing}
  updateField={updateField}
/>
```

## 유지보수 관점

- 새 CRUD 화면은 API 함수, `columns`, `createEmptyItem`, `validateRow`만 제공하면 동일한 Admin 리스트 UX를 재사용할 수 있다.
- 테이블 스타일, 모바일 카드 스타일, 상태 배지 문구를 바꿀 때 한 파일만 수정하면 된다.
- 과한 generic grid를 만들지 않고 현재 Admin CRUD에 필요한 수준의 추상화만 유지했다.
- Tailwind 클래스는 역할별 컴포넌트에 모아 긴 JSX를 줄였고, 페이지 파일은 도메인 정보 중심으로 읽히게 했다.

## 검증

- `npm.cmd run build`
- `npm.cmd run lint`

두 명령 모두 통과했다.
