# 게시글 목록 조회 API 스펙

## 목적

- 프론트 `devnote`의 게시글 목록 화면이 정적 목업 데이터 대신 백엔드 API를 통해 게시글 목록을 조회한다.
- 1차 범위는 게시글 목록 조회에만 집중한다.
- 검색, 카테고리 필터, 인기순 정렬은 초기에는 프론트 메모리 기반으로 유지하고, 이후 API 쿼리 파라미터로 확장한다.

## 1차 엔드포인트

- Method: `GET`
- Path: `/api/posts`
- 인증: 없음
- 응답 형식: `application/json`

## 1차 응답 정책

- 목록은 최신 글 우선으로 반환한다.
- 백엔드는 H2 메모리 DB에서 게시글 목록을 조회한다.
- 응답은 엔티티를 직접 노출하지 않고 DTO를 사용한다.

## 응답 필드

| 필드명 | 타입 | 설명 |
| --- | --- | --- |
| `id` | `number` | 게시글 ID |
| `slug` | `string` | 게시글 상세 경로용 슬러그 |
| `categoryName` | `string` | 화면 표시용 카테고리명 |
| `categorySlug` | `string` | 카테고리 경로용 슬러그 |
| `title` | `string` | 게시글 제목 |
| `excerpt` | `string` | 목록 요약문 |
| `displayDate` | `string` | 화면 표시용 날짜 문자열 |
| `readTime` | `string` | 예: `5분 읽기` |
| `viewCount` | `number` | 숫자형 조회수 |
| `tags` | `string[]` | 태그 목록 |
| `thumbnailStyle` | `string` | 프론트 썸네일 스타일 키 |

## 응답 예시

```json
[
  {
    "id": 1,
    "slug": "spring-boot-exception-handling",
    "categoryName": "Spring Boot",
    "categorySlug": "spring-boot",
    "title": "Spring Boot 3.x 예외 처리 정리",
    "excerpt": "@ControllerAdvice를 이용한 공통 예외 처리와 응답 설계 방법을 정리합니다.",
    "displayDate": "2024.05.20",
    "readTime": "5분 읽기",
    "viewCount": 1200,
    "tags": ["Spring Boot", "Java", "Exception", "API"],
    "thumbnailStyle": "laptop"
  },
  {
    "id": 2,
    "slug": "spring-data-jpa-guide",
    "categoryName": "Spring Boot",
    "categorySlug": "spring-boot",
    "title": "Spring Data JPA 실전 가이드",
    "excerpt": "엔티티 설계부터 성능 최적화 포인트까지 JPA 실무 감각으로 정리합니다.",
    "displayDate": "2024.05.17",
    "readTime": "6분 읽기",
    "viewCount": 1400,
    "tags": ["Spring Data JPA", "ORM", "Database", "Performance"],
    "thumbnailStyle": "data"
  }
]
```

## 프론트 매핑 기준

- `categoryName` -> 현재 `post.category`
- `displayDate` -> 현재 `post.date`
- `viewCount` -> 프론트에서 `1.2K` 같은 문자열 포맷으로 변환 가능
- `thumbnailStyle` -> 현재 `post.imageStyle`

## 1차 범위에서 제외

- 페이지네이션
- 서버 검색
- 서버 카테고리 필터
- 서버 인기순 정렬
- 인기 게시글/카테고리 집계 API

## 후속 확장 예정

- `GET /api/posts?category=spring-boot`
- `GET /api/posts?query=spring`
- `GET /api/posts?sort=latest|popular`
- 페이지네이션 응답 객체로 전환

## 구현 시 확인 사항

- `Spring Security` 설정에서 `GET /api/posts`를 허용해야 한다.
- 프론트 개발 서버와의 연동을 위해 CORS 또는 Vite proxy가 필요하다.
- `viewCount`는 백엔드에서는 숫자로 유지하고, 화면 포맷은 프론트에서 처리한다.
- 날짜는 초기에는 표시용 문자열로 내려주고, 이후 필요 시 ISO 날짜 필드를 추가한다.
