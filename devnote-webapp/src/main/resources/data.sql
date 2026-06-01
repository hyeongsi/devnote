INSERT INTO categories (
    id,
    slug,
    name,
    description,
    visible,
    display_order
)
VALUES
    (
        1,
        'spring-boot',
        'Spring Boot',
        'Spring Boot 관련 개발 기록과 실전 정리를 모아둔 카테고리입니다.',
        TRUE,
        1
    ),
    (
        2,
        'ai-automation',
        'AI 자동화',
        'AI와 자동화 도구를 실제로 적용한 기록을 모아둔 카테고리입니다.',
        TRUE,
        2
    ),
    (
        3,
        'devops',
        'DevOps',
        '배포, 운영, 자동화 관련 내용을 정리한 카테고리입니다.',
        TRUE,
        3
    ),
    (
        4,
        'java',
        'Java',
        'Java 언어와 백엔드 개발 내용을 정리한 카테고리입니다.',
        TRUE,
        4
    ),
    (
        5,
        'database',
        'Database',
        '데이터 모델링과 성능 최적화 기록을 모아둔 카테고리입니다.',
        TRUE,
        5
    ),
    (
        6,
        'infra',
        'Infra',
        '서버, 운영, 모니터링 관련 내용을 모아둔 카테고리입니다.',
        FALSE,
        6
    ),
    (
        7,
        'etc',
        'Etc',
        '기타 개발 기록과 실험 내용을 담은 카테고리입니다.',
        FALSE,
        7
    );

INSERT INTO menus (
    id,
    name,
    path,
    state,
    visible,
    display_order
)
VALUES
    (1, '홈', '/', '운영 중', TRUE, 1),
    (2, '블로그', '/posts', '운영 중', TRUE, 2),
    (3, '프로젝트', '/projects', '운영 중', TRUE, 3),
    (4, 'AI 자동 포스팅', '/admin/ai-posting', '운영 중', TRUE, 4),
    (5, '기술 스택', '/stack', '준비 중', FALSE, 5),
    (6, '소개', '/about', '준비 중', FALSE, 6),
    (7, '문의', '/contact', '준비 중', FALSE, 7);

UPDATE menus
SET name = '루트', path = '/__root', state = 'SYSTEM', visible = FALSE, display_order = 0, area = 'ROOT', parent_id = NULL
WHERE id = 1;

UPDATE menus
SET name = '운영자', path = '', state = '', visible = FALSE, display_order = 1, area = '', parent_id = 1
WHERE id = 2;

UPDATE menus
SET name = '헤더', path = '', state = '', visible = FALSE, display_order = 2, area = '', parent_id = 1
WHERE id = 3;

UPDATE menus
SET name = '대시보드', path = '/admin', state = '', visible = TRUE, display_order = 1, area = 'ADMIN', parent_id = 2
WHERE id = 4;

UPDATE menus
SET name = '게시글 관리', path = '/posts', state = '', visible = TRUE, display_order = 2, area = 'ADMIN', parent_id = 2
WHERE id = 5;

UPDATE menus
SET name = '카테고리 관리', path = '/admin/categories', state = '', visible = TRUE, display_order = 3, area = 'ADMIN', parent_id = 2
WHERE id = 6;

UPDATE menus
SET name = '메뉴 관리', path = '/admin/menus', state = '', visible = TRUE, display_order = 4, area = 'ADMIN', parent_id = 2
WHERE id = 7;

INSERT INTO menus (
    id,
    name,
    path,
    state,
    visible,
    display_order,
    area,
    parent_id
)
VALUES
    (8, 'AI 자동 포스팅', '/admin/ai-posting', '', TRUE, 5, 'ADMIN', 2),
    (9, '홈', '/', '', TRUE, 1, 'HEADER', 3),
    (10, '블로그', '/posts', '', TRUE, 2, 'HEADER', 3),
    (11, '프로젝트', '/projects', '', TRUE, 3, 'HEADER', 3),
    (12, '소개', '/about', '', FALSE, 4, 'HEADER', 3);

INSERT INTO posts (
    id,
    slug,
    category_id,
    title,
    excerpt,
    published_at,
    read_time,
    view_count,
    thumbnail_style,
    content_markdown
)
VALUES
    (
        1,
        'spring-boot-exception-handling',
        1,
        'Spring Boot 3.x 예외 처리 정리',
        '@ControllerAdvice를 이용한 공통 예외 처리와 응답 설계 방법을 정리했습니다.',
        DATE '2024-05-20',
        '5분 읽기',
        1200,
        'laptop',
        '## 예외 처리 전략

Spring Boot 3.x에서는 예외 처리를 컨트롤러마다 흩어 놓기보다 공통 정책으로 모으는 편이 유지보수와 응답 일관성에 유리합니다.

이번 글에서는 `@ControllerAdvice`를 중심으로 API 오류 응답을 통일하고, 예외별 상태 코드와 메시지를 읽기 쉽게 내려주는 구조를 정리했습니다.

> 핵심 목표는 서비스 로직과 HTTP 응답 로직을 분리하여 수정 비용을 낮추는 것입니다.

## 공통 응답 모델 설계

클라이언트가 오류를 안정적으로 처리하려면 `message` 하나만 내려주는 방식보다 `code`, `message`, `timestamp` 같은 필드를 함께 주는 편이 좋습니다.

- 검증 오류와 비즈니스 오류를 구분한다.
- 프론트가 그대로 사용할 메시지와 로그용 데이터를 나눈다.
- 예외 이름이 아니라 프론트 화면에 노출할 코드를 정의한다.

```java
public record ErrorResponse(
    String code,
    String message,
    LocalDateTime timestamp
) {
}
```

## 적용 포인트

중요한 것은 예외를 어디서 발생시키고 어디서 응답으로 변환할지를 분리하는 것입니다.

이렇게 하면 서비스 계층은 도메인 규칙에만 집중할 수 있고, 컨트롤러 계층은 HTTP 응답 규칙을 한 곳에서 관리할 수 있습니다.'
    ),
    (
        2,
        'spring-data-jpa-guide',
        1,
        'Spring Data JPA 실전 가이드',
        '엔티티 설계부터 성능 최적화 포인트까지 JPA 실무 감각으로 정리했습니다.',
        DATE '2024-05-17',
        '6분 읽기',
        1400,
        'data',
        '## JPA 시작 전에 봐야 할 것

Spring Data JPA는 빠르게 개발을 시작하게 해주지만 엔티티 설계와 조회 전략을 놓치면 금방 성능 이슈가 생깁니다.

이번 글에서는 엔티티 관계를 어떻게 나누고 어떤 시점에 fetch join이나 Querydsl을 도입해야 하는지 기준을 정리했습니다.

## 조회 성능 개선

목록 화면은 대부분 정렬과 필터가 함께 붙기 때문에 Repository 메서드만으로는 설계가 부족해질 수 있습니다.

> Querydsl과 같이 사용하면 동적 조건을 읽기 좋은 형태로 유지하면서, 필요한 필드만 선택해 DTO로 조회하기 쉬워집니다.

```json
{
  "query": "selectFrom(post)",
  "filters": ["category", "publishedAt", "keyword"],
  "projection": "PostSummaryResponse"
}
```

## 운영 관점 체크포인트

N+1 문제를 테스트 단계에서 미리 발견하고, 페이지 기준을 명확히 잡는 것이 장기적으로 큰 차이를 만듭니다.

- 정렬 컬럼 인덱스를 먼저 점검한다.
- 조회 빈도가 높은 조건을 우선순위로 관리한다.
- 목록과 상세 응답을 분리해 과한 필드 로딩을 막는다.'
    ),
    (
        3,
        'docker-dev-environment',
        3,
        'Docker로 개발 환경 구성하기',
        '컨테이너 기반으로 개발 환경을 통일하고 배포 전까지 연결하는 과정을 정리했습니다.',
        DATE '2024-05-15',
        '6분 읽기',
        1600,
        'docker',
        '## 왜 개발 환경을 컨테이너로 맞추는가

개발자마다 로컬 환경이 다르면 실행은 되는데 배포에서 깨지는 상황이 자주 발생합니다.

Docker 기반 개발 환경은 실행 조건을 코드로 고정하기 때문에 협업과 작업 속도를 함께 끌어올릴 수 있습니다.

## compose로 서비스 묶기

애플리케이션, 데이터베이스, 캐시처럼 함께 움직여야 하는 서비스를 `docker compose`로 관리하면 실행 흐름이 단순해집니다.

- 환경 변수
- 포트
- 볼륨

이 세 가지를 파일에 모아 두면 팀 단위로 같은 기준을 공유하기 쉬워집니다.

## 배포 전 확인 포인트

> 개발 설정과 운영 설정을 분리하고, 이미지 빌드 단계에서 불필요한 파일이 포함되지 않도록 점검해야 합니다.

```bash
docker compose up -d
docker compose exec app ./gradlew test
docker compose down
```'
    );

INSERT INTO post_tags (post_id, tag_order, tag_name)
VALUES
    (1, 0, 'Spring Boot'),
    (1, 1, 'Java'),
    (1, 2, 'Exception'),
    (1, 3, 'API'),
    (2, 0, 'Spring Data JPA'),
    (2, 1, 'ORM'),
    (2, 2, 'Database'),
    (2, 3, 'Performance'),
    (3, 0, 'Docker'),
    (3, 1, 'DevOps'),
    (3, 2, 'Container'),
    (3, 3, 'Infra');
