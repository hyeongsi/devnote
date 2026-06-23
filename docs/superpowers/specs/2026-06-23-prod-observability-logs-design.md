# Production Observability Logs Design

## Goal

운영 서버를 `journalctl`로 볼 때 백엔드가 살아 있는지, AI 글 생성/자동게시 흐름이 어디에서 멈췄는지 확인할 수 있게 한다.

## Scope

- systemd 환경에 맞춰 콘솔 로그를 남긴다. 별도 파일 로그와 JSON 로그는 이번 범위에서 제외한다.
- 운영 소음을 줄이기 위해 핵심 이벤트만 `INFO`로 남긴다.
- 예기치 못한 요청 실패와 5xx 응답만 request error 로그로 남긴다.
- 프롬프트, 본문, 쿠키, API 키, Authorization 헤더, 긴 사용자 입력은 로그에 남기지 않는다.

## Log Events

- 애플리케이션 기동 완료: active profile, AI 자동게시 enabled 여부, Gemini 설정 여부
- 수동 AI 글 생성: 시작, 성공, 실패. 성공 시 `draftId`, 제목, 소요 시간
- 자동게시 스케줄러: trigger, disabled/gemini 미설정 skip
- 자동게시 실행: 시작, skip, 성공, 실패. `runId`, `topicId`, `postId`, 소요 시간
- 초안 관리: 초안 조회, 초안 게시 성공/실패
- HTTP request error: 예외 또는 5xx 응답에 한해 method/path/status/errorType/duration

## Testing

Spring Boot의 log output capture를 사용해 로그 이벤트가 실제로 출력되는지 검증한다. 요청 error 로그는 필터 단위 테스트로 5xx는 남고 4xx는 남지 않는지 확인한다.
