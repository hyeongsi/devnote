# 프론트 게시글 목록 필드 사용처 정리

## 목적

- 게시글 목록 화면에서 실제로 사용하는 필드를 식별한다.
- 백엔드 DTO를 목록 화면 기준 최소 필드로 설계할 수 있게 한다.
- 게시글 목록 API로 대체할 범위와, 당장은 정적 데이터로 유지할 범위를 구분한다.

## 대상 화면

- `D:\workspace\ai\devnote\devnote\src\pages\PostListPage.tsx`
- `D:\workspace\ai\devnote\devnote\src\features\PostListItem.tsx`
- `D:\workspace\ai\devnote\devnote\src\features\PostSidebar.tsx`

## 결론

- 게시글 목록 본문 렌더링에는 게시글 리스트 API가 필요하다.
- 카테고리 목록과 인기 게시글 사이드바는 현재 별도 정적 데이터 의존이 있으며, 1차 범위에서는 API 전환 대상에서 제외해도 된다.
- 따라서 1차 `GET /api/posts`는 본문 목록 렌더링과 검색/정렬에 필요한 필드만 우선 제공하면 된다.

## 본문 목록에서 실제 사용하는 필드

### `PostListPage.tsx`

- `id`
  - React list key에 사용
- `categorySlug`
  - 현재 카테고리별 목록 필터링에 사용
- `title`
  - 검색 대상에 사용
- `excerpt`
  - 검색 대상에 사용
- `category`
  - 검색 대상에 사용
- `views`
  - 인기순 정렬 시 문자열을 숫자로 변환해 사용

### `PostListItem.tsx`

- `category`
  - 카드 상단 카테고리 텍스트 표시
- `title`
  - 카드 제목 표시
- `excerpt`
  - 카드 요약문 표시
- `date`
  - 메타 정보 표시
- `readTime`
  - 메타 정보 표시
- `views`
  - 조회수 텍스트 표시
- `imageStyle`
  - 썸네일 스타일 선택에 사용
- `slug`
  - 상세 경로 생성에 사용
- `categorySlug`
  - 상세 경로 생성에 사용

## 현재 목록 API 최소 필요 필드

| 프론트 내부 필드 | API 권장 필드 | 필요 이유 |
| --- | --- | --- |
| `id` | `id` | 리스트 key |
| `category` | `categoryName` | 카테고리 표시, 검색 |
| `categorySlug` | `categorySlug` | 카테고리 필터, 상세 경로 |
| `title` | `title` | 표시, 검색 |
| `excerpt` | `excerpt` | 표시, 검색 |
| `date` | `displayDate` | 표시 |
| `readTime` | `readTime` | 표시 |
| `views` | `viewCount` | 표시, 인기순 정렬 |
| `imageStyle` | `thumbnailStyle` | 썸네일 스타일 |
| `slug` | `slug` | 상세 경로 |

## 프론트 변환이 필요한 필드

- `categoryName` -> 프론트의 기존 `category` 형태로 매핑
- `displayDate` -> 프론트의 기존 `date` 형태로 매핑
- `viewCount`
  - API는 숫자형으로 유지
  - 프론트에서 `1200` -> `1.2K` 같은 표시 문자열로 변환 가능
- `thumbnailStyle` -> 프론트의 기존 `imageStyle` 형태로 매핑

## 현재 목록 API에 없어도 되는 필드

- `tags`
  - 현재 목록 카드에서는 표시하지 않음
  - 다만 추후 검색/필터 확장을 고려하면 유지해도 무방

## 1차 범위에서 정적 데이터 유지 가능한 영역

### 카테고리 목록

- 사용 위치: `PostListPage.tsx`, `PostSidebar.tsx`
- 현재 사용 필드:
  - `slug`
  - `name`
  - `count`
- 판단:
  - 1차 게시글 목록 API 구현과 직접 연결되지 않음
  - 초기에는 `siteData.ts` 또는 별도 정적 상수로 유지 가능

### 인기 게시글 사이드바

- 사용 위치: `PostSidebar.tsx`
- 현재 사용 필드:
  - `rank`
  - `title`
  - `views`
- 판단:
  - 목록 본문 API와 별개 관심사
  - 1차 범위에서는 정적 데이터 유지 가능

## 구현 시 바로 반영할 메모

- 프론트 `BlogPost.views`는 현재 문자열인데, 백엔드 API는 숫자형 `viewCount`로 두는 편이 낫다.
- 프론트에서 API 응답을 화면 전용 타입으로 매핑하는 계층을 하나 두는 게 안전하다.
- `PostListPage`의 인기순 정렬은 API 전환 직후에도 프론트 메모리 기준으로 유지할 수 있다.
- `categoryPopularPosts`, `popularPosts`, `blogCategories`는 게시글 목록 API 전환과 분리해서 다뤄야 영향 범위가 작다.
