INSERT INTO posts (id, slug, category_name, category_slug, title, excerpt, published_at, read_time, view_count, thumbnail_style)
VALUES
    (1, 'spring-boot-exception-handling', 'Spring Boot', 'spring-boot', 'Spring Boot 3.x 예외 처리 정리', '@ControllerAdvice를 이용한 공통 예외 처리와 응답 설계 방법을 정리합니다.', DATE '2024-05-20', '5분 읽기', 1200, 'laptop'),
    (2, 'spring-data-jpa-guide', 'Spring Boot', 'spring-boot', 'Spring Data JPA 실전 가이드', '엔티티 설계부터 성능 최적화 포인트까지 JPA 실무 감각으로 정리합니다.', DATE '2024-05-17', '6분 읽기', 1400, 'data'),
    (3, 'docker-dev-environment', 'DevOps', 'devops', 'Docker로 개발 환경 구성하기', '컨테이너 기반으로 개발 환경을 통일하고 배포 흐름까지 연결하는 과정을 정리합니다.', DATE '2024-05-15', '6분 읽기', 1600, 'docker');

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
