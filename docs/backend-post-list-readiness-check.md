# 백엔드 게시글 목록 API 준비 상태 점검

## 점검 대상

- 프로젝트: `D:\workspace\ai\devnote\devnote-webapp`
- 확인 파일:
  - `build.gradle`
  - `src/main/resources/application.properties`
  - `src/main/java/io/hyeongsi/devnotewebapp/DevnoteWebappApplication.java`
  - `src/test/java/io/hyeongsi/devnotewebapp/DevnoteWebappApplicationTests.java`

## 현재 상태 요약

- Spring Boot 애플리케이션 기본 진입점은 존재한다.
- JPA, Security, H2 런타임 의존성은 포함되어 있다.
- 하지만 게시글 목록 API 구현에 필요한 Web 계층 의존성과 실제 DB/보안 설정은 아직 없다.
- 현재 상태로는 `GET /api/posts`를 구현하기 위한 뼈대가 충분하지 않다.

## 현재 확인된 의존성 상태

### 이미 포함된 항목

- `org.springframework.boot:spring-boot-starter-data-jpa`
  - JPA 엔티티, Repository, DB 연동 기반으로 적절함
- `org.springframework.boot:spring-boot-starter-security`
  - 이후 공개 API 허용 설정 필요
- `com.h2database:h2`
  - H2 메모리 DB 런타임 의존성 존재
- `org.projectlombok:lombok`
  - 선택적으로 사용 가능

### 보완이 필요한 항목

- `spring-boot-starter-web`
  - 현재 없음
  - `@RestController`, JSON 응답, HTTP API 제공에 사실상 필요
- 테스트용 `spring-boot-starter-test`
  - 현재 없음
  - 컨트롤러/서비스/통합 테스트 작성 시 일반적으로 필요

## 현재 설정 상태

### `application.properties`

현재 설정:

```properties
spring.application.name=devnote-webapp
```

판단:

- H2 메모리 DB URL 설정 없음
- JPA ddl-auto 설정 없음
- SQL 초기 데이터 로딩 관련 설정 없음
- H2 콘솔 접근 설정 없음
- 로깅 또는 SQL 확인용 설정 없음
- 서버 포트, CORS, 보안 관련 명시 설정 없음

## 현재 소스 구조 상태

### 존재하는 항목

- 애플리케이션 진입점 1개
- 컨텍스트 로드 테스트 1개

### 아직 없는 항목

- `controller`
- `service`
- `repository`
- `entity`
- `dto`
- `config/security`
- `data.sql` 또는 초기 데이터 주입 코드

## 게시글 목록 API 구현을 위해 필요한 수정 목록

### 1. 의존성 추가

- `spring-boot-starter-web` 추가
- 필요 시 `spring-boot-starter-test` 추가

완료 기준:

- 컨트롤러와 JSON 응답을 처리할 수 있는 상태

### 2. H2 메모리 DB 설정 추가

필요 항목 예시:

- `spring.datasource.url`
- `spring.datasource.driver-class-name`
- `spring.datasource.username`
- `spring.datasource.password`
- `spring.jpa.hibernate.ddl-auto`
- `spring.jpa.defer-datasource-initialization`
- `spring.h2.console.enabled`

완료 기준:

- 서버 기동 시 H2 메모리 DB가 연결되고 테이블 생성/초기화 준비가 됨

### 3. 보안 설정 추가

필요 이유:

- `spring-boot-starter-security`가 있으므로 기본 상태에서는 모든 요청이 차단될 가능성이 큼

필요 방향:

- `GET /api/posts`는 인증 없이 허용
- H2 콘솔도 개발 중 접근 가능하도록 별도 허용 검토
- CSRF / frame options 는 H2 콘솔 사용 시 조정 필요 가능성 있음

완료 기준:

- 프론트에서 목록 API 호출 시 401/403 없이 응답 가능

### 4. CORS 또는 프록시 대응 준비

필요 이유:

- 프론트 `devnote`와 백엔드 `devnote-webapp`는 로컬에서 서로 다른 서버로 실행될 가능성이 큼

선택지:

- 백엔드에서 CORS 허용
- 프론트 Vite proxy 사용

완료 기준:

- 브라우저에서 CORS 에러 없이 API 호출 가능

### 5. 테스트 기반 보완

현재 상태:

- `contextLoads`만 존재

필요 항목:

- 목록 API 응답 검증 테스트
- 서비스 또는 리포지토리 조회 테스트

완료 기준:

- 최소한 목록 조회 정상 응답을 자동으로 확인할 수 있음

## 바로 다음 단계에서 착수할 구현 단위

1. `build.gradle`에 Web 의존성 추가
2. `application.properties`에 H2/JPA/H2 console 설정 추가
3. Security 설정 클래스 추가
4. 게시글 엔티티/리포지토리/서비스/컨트롤러 생성
5. 샘플 데이터 주입

## 리스크 및 확인 포인트

- 가장 큰 누락은 `spring-boot-starter-web` 부재다.
- Security가 이미 포함되어 있으므로 API만 만들고 끝내면 호출이 막힐 가능성이 높다.
- H2 콘솔을 쓰려면 보안 설정에서 frame 관련 예외 처리가 필요할 수 있다.
- 현재 테스트 의존성이 제한적이라, API 레벨 검증을 위해 테스트 스타터 보강이 필요할 수 있다.
- `runtimeOnly 'com.mysql:mysql-connector-j'`는 현재 H2 메모리 DB 범위에서는 필수는 아니지만, 이후 프로파일 분리 계획이 있으면 유지 가능하다.
