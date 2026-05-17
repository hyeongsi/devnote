# Git Rules

## Commit Convention

- feat: 기능 추가
- fix: 버그 수정
- refactor: 리팩토링
- docs: 문서 수정
- style: 스타일 변경
- chore: 기타 설정
- test: 테스트

## Commit Message Rules

- 모든 커밋 메시지는 한글로 작성
- 한 줄 요약은 명확하게 작성
- 불필요한 영어 혼합 금지

## Pull Request Rules

- PR 제목은 한글 작성
- `[codex]` 사용 금지
- PR 본문 한글 작성
- 작업 내용 / 변경 사항 / 테스트 여부 포함

## Encoding Rules

- 문서, 소스 코드, 커밋 메시지, PR 제목/본문은 UTF-8 기준으로 작성한다.
- 한글이 포함된 텍스트를 API로 전송할 때는 UTF-8 인코딩이 보장되는 방식만 사용한다.
- PowerShell 또는 REST API로 PR을 생성/수정할 때는 요청 본문을 UTF-8 JSON으로 전송한다.
- 쉘에서 한글이 깨질 가능성이 있으면, 한글 원문을 직접 넣지 말고 UTF-8 파일 또는 Unicode escape 기반 JSON을 사용한다.
- PR 본문에 한글 깨짐이 발생하면 머지 전에 즉시 본문을 수정한다.

## Pull Request Automation Rules

- 브랜치 푸시가 끝났고 사용자가 PR 생성을 요청하면, 가능한 경우 PR까지 자동 생성한다.
- PR 생성 우선순위는 아래 순서를 따른다.

### 1차 시도

- GitHub 연결 도구의 PR 생성 기능을 먼저 사용한다.

### 2차 fallback

- GitHub 연결 도구에서 `403 Resource not accessible by integration`가 발생하면, Git에 저장된 GitHub 자격 증명을 사용해 REST API로 PR을 생성한다.
- 이 방식은 `git push`가 이미 성공한 동일한 저장소/계정 흐름을 재사용한다.

### fallback 실행 원칙

- `git credential fill`로 GitHub 자격 증명을 조회한다.
- 조회한 자격 증명은 같은 명령 안에서만 사용하고, 출력하지 않는다.
- GitHub REST API `POST /repos/{owner}/{repo}/pulls`로 PR을 생성한다.
- PR 제목과 본문은 저장소 규칙에 맞춰 한글로 작성한다.

### fallback 사용 조건

- 현재 브랜치가 원격에 이미 푸시되어 있어야 한다.
- 로컬 Git credential helper에 GitHub 인증 정보가 저장되어 있어야 한다.
- 토큰이나 비밀번호는 문서, 로그, 응답 본문에 남기지 않는다.

### 기본 동작 규칙

- 사용자가 “PR까지” 요청한 경우, 1차 시도 실패 후 2차 fallback까지 자동으로 이어서 시도한다.
- 2차 fallback도 실패하면 그때만 수동 PR 링크를 사용자에게 제공한다.
