INSERT INTO posts (
    id,
    slug,
    category_name,
    category_slug,
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
        'Spring Boot',
        'spring-boot',
        'Spring Boot 3.x 예외 처리 정리',
        '@ControllerAdvice를 이용한 공통 예외 처리와 응답 설계 방법을 정리했습니다.',
        DATE '2024-05-20',
        '5분 읽기',
        1200,
        'laptop',
        '## 예외 처리 전략

Spring Boot 3.x에서는 예외 처리를 컨트롤러마다 흩어 놓기보다 공통 정책으로 모으는 편이 유지보수에 훨씬 유리합니다.

이번 글에서는 `@ControllerAdvice`를 중심으로 API 오류 응답을 통일하고, 예외별 상태 코드와 메시지를 일관되게 내려주는 구조를 정리했습니다.

> 핵심 목표는 서비스 로직과 HTTP 응답 로직을 분리해 수정 비용을 낮추는 것입니다.

## 공통 응답 모델 설계

클라이언트가 안정적으로 오류를 처리하려면 `message` 하나만 내려주는 방식보다 `code`, `message`, `timestamp` 같은 필드를 함께 주는 편이 좋습니다.

- 검증 오류와 비즈니스 오류를 구분한다.
- 프론트가 그대로 사용자 메시지와 로깅 데이터에 활용할 수 있게 한다.
- 예외 이름이 아니라 도메인 의미가 드러나는 코드를 쓴다.

```java
public record ErrorResponse(
    String code,
    String message,
    LocalDateTime timestamp
) {
}
```

## 적용 포인트

핵심은 예외를 던지는 지점과 응답으로 변환하는 지점을 분리하는 것입니다.

이렇게 하면 서비스 계층은 도메인 규칙에만 집중할 수 있고, 컨트롤러 계층은 HTTP 응답 규칙을 한 곳에서 관리할 수 있습니다.'
    ),
    (
        2,
        'spring-data-jpa-guide',
        'Spring Boot',
        'spring-boot',
        'Spring Data JPA 실전 가이드',
        '엔티티 설계부터 성능 최적화 포인트까지 JPA 실무 감각으로 정리했습니다.',
        DATE '2024-05-17',
        '6분 읽기',
        1400,
        'data',
        '## JPA 시작 전 점검할 것

Spring Data JPA는 빠르게 개발을 시작하게 해주지만, 엔티티 설계와 조회 전략을 먼저 잡지 않으면 금방 성능 이슈가 생깁니다.

이번 글에서는 엔티티 관계를 어떻게 나누고, 어떤 시점에 fetch join이나 Querydsl을 함께 도입해야 하는지 기준을 정리했습니다.

## 조회 성능 개선

목록 화면은 대부분 정렬과 필터가 함께 붙기 때문에 Repository 메서드만으로는 한계가 있습니다.

> Querydsl을 같이 사용하면 동적 조건을 읽기 좋은 형태로 유지할 수 있고, 필요한 필드만 선택해 DTO로 조회하기도 쉬워집니다.

```json
{
  "query": "selectFrom(post)",
  "filters": ["category", "publishedAt", "keyword"],
  "projection": "PostSummaryResponse"
}
```

## 운영 관점 체크포인트

N+1 문제를 테스트 단계에서 미리 발견하고, 페이징 기준을 명확히 두는 것이 장기적으로 큰 차이를 만듭니다.

- 정렬 컬럼 인덱스를 먼저 점검한다.
- 조회 빈도가 높은 조건을 우선순위로 관리한다.
- 목록과 상세 응답을 분리해 과한 필드 로딩을 막는다.'
    ),
    (
        3,
        'docker-dev-environment',
        'DevOps',
        'devops',
        'Docker로 개발 환경 구성하기',
        '컨테이너 기반으로 개발 환경을 통일하고 배포 흐름까지 연결하는 과정을 정리했습니다.',
        DATE '2024-05-15',
        '6분 읽기',
        1600,
        'docker',
        '## 왜 개발 환경을 컨테이너로 맞추는가

개발자마다 로컬 환경이 다르면 실행은 되는데 배포에서 깨지는 상황이 자주 발생합니다.

Docker 기반 개발 환경은 실행 조건을 코드로 고정해 두기 때문에 온보딩과 협업 속도를 함께 끌어올릴 수 있습니다.

## compose로 서비스 묶기

애플리케이션, 데이터베이스, 캐시처럼 함께 움직여야 하는 서비스를 `docker compose`로 관리하면 실행 흐름이 단순해집니다.

- 환경 변수
- 포트
- 볼륨

이 세 가지를 한 파일에 모아 두면 팀 단위로 같은 기준을 공유하기 쉬워집니다.

## 배포 전 확인할 부분

> 개발용 설정과 운영용 설정을 분리하고, 이미지 빌드 단계에서 불필요한 파일이 포함되지 않도록 점검해야 합니다.

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
