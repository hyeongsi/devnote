# AI 글 임시저장 및 재불러오기 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 수동 AI 글 생성 성공 결과를 서버 임시저장으로 보존하고, 최근 자동 게시 목록에서 임시저장 상태인 기록만 다시 불러와 게시할 수 있게 한다.

**Architecture:** `AiPostDraft`가 수동 생성 결과와 게시 전 상태를 소유한다. 생성 서비스가 성공 결과를 저장하며, 관리자 서비스가 자동 게시 실행 기록과 초안 기록을 하나의 이력으로 합치고 초안 조회·게시 트랜잭션을 제공한다. 프런트엔드는 활성 `draftId`를 추적하여 복원과 게시 완료 상태 전환을 연결한다.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, Querydsl, JUnit 5, Mockito, React 19, TypeScript 6, Node assertion tests

---

## 파일 구조

- 생성: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraft.java` — 초안 데이터와 상태 전환을 담당한다.
- 생성: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftStatus.java` — `DRAFT`, `PUBLISHED` 상태를 정의한다.
- 생성: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftRepository.java` — 최근 초안과 단건 초안을 조회한다.
- 생성: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftDtos.java` — 생성 결과, 상세, 통합 이력, 게시 요청 응답 계약을 정의한다.
- 수정: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/service/AiPostGenerateService.java` — 생성 성공 직후 초안을 저장한다.
- 수정: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/controller/AiPostController.java` — `draftId`가 포함된 생성 응답을 반환한다.
- 수정: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingAdminService.java` — 통합 이력, 초안 조회, 게시 트랜잭션을 제공한다.
- 수정: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingController.java` — 초안 상세·게시 API를 노출한다.
- 수정: `devnote/src/types.ts`, `devnote/src/api/aiPosts.ts`, `devnote/src/api/aiAutoPosting.ts` — 새 API 타입과 호출 함수를 제공한다.
- 수정: `devnote/src/pages/admin/AdminAiPostingPage.tsx` — 활성 초안 추적, 목록 클릭 복원, 초안 게시를 구현한다.
- 테스트: 백엔드 AI 생성/관리 서비스/컨트롤러 테스트와 프런트 API/UI 소스 검증 테스트.

### Task 1: 초안 모델과 생성 성공 저장

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraft.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftStatus.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftRepository.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftDtos.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/service/AiPostGenerateService.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/controller/AiPostController.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/AiPostGenerateServiceTest.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/AiPostControllerTest.java`

- [x] **Step 1: 생성 성공 저장과 실패 미저장 테스트 작성**

서비스 테스트에 저장소와 고정 `Clock`을 주입하고 다음 핵심 검증을 추가한다.

```java
AiPostDraftDtos.GeneratedDraft response = service.generate(request);

assertThat(response.draftId()).isEqualTo(41L);
verify(draftRepository).save(argThat(draft ->
        draft.getTopic().equals("Spring Security")
                && draft.getStatus() == AiPostDraftStatus.DRAFT
));
```

AI 클라이언트가 예외를 던지는 테스트에서는 `verifyNoInteractions(draftRepository)`로 실패 기록이 생성되지 않음을 검증한다. 컨트롤러 테스트에는 `$.draftId` 응답 검증을 추가한다.

- [x] **Step 2: 실패 확인**

Run: `cd devnote-webapp && ./gradlew test --tests "*AiPostGenerateServiceTest" --tests "*AiPostControllerTest"`

Expected: `AiPostDraft`, `GeneratedDraft`, 새 생성 서비스 생성자가 없어 컴파일 실패.

- [x] **Step 3: 최소 모델과 저장 구현**

상태는 다음과 같이 제한한다.

```java
public enum AiPostDraftStatus {
    DRAFT,
    PUBLISHED
}
```

`AiPostDraft` 생성자는 주제, 생성 응답, 생성 시각을 받아 모든 생성 결과를 보존하고 상태를 `DRAFT`로 설정한다. `AiPostGenerateService.generate`는 AI 응답 유효성 검증 뒤 저장하고 다음 DTO를 반환한다.

```java
public record GeneratedDraft(Long draftId, AiPostGenerateResponse result) {}
```

- [x] **Step 4: 대상 테스트 통과 확인**

Run: `cd devnote-webapp && ./gradlew test --tests "*AiPostGenerateServiceTest" --tests "*AiPostControllerTest"`

Expected: 대상 테스트 PASS.

- [x] **Step 5: 커밋**

```bash
git add devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai
git commit -m "feat: AI 생성 결과 임시저장 추가"
```

### Task 2: 통합 이력과 임시저장 조회·게시 API

**Files:**
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftRepository.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/draft/AiPostDraftDtos.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingAdminService.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingController.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingAdminServiceTest.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingControllerTest.java`

- [x] **Step 1: 통합 이력, 조회 제한, 게시 전환 테스트 작성**

통합 이력 테스트는 자동 실행과 임시저장을 생성 시각 역순으로 정렬하고 다음 속성을 검증한다.

```java
assertThat(history).extracting(HistoryItem::topic, HistoryItem::loadable)
        .containsExactly(
                tuple("Spring Security", true),
                tuple("JPA indexing", false)
        );
```

게시 테스트는 `postService.createPost(request)` 반환 ID가 초안의 `publish(postId, now)`에 반영되는지 검증한다. `PUBLISHED` 초안 조회와 게시에는 `409 CONFLICT`가 발생해야 한다.

- [x] **Step 2: 실패 확인**

Run: `cd devnote-webapp && ./gradlew test --tests "*AiAutoPostingAdminServiceTest" --tests "*AiAutoPostingControllerTest"`

Expected: 이력/초안 API 메서드와 DTO가 없어 컴파일 실패.

- [x] **Step 3: 관리자 서비스와 컨트롤러 최소 구현**

다음 계약을 구현한다.

```java
public record HistoryItem(
        String key, Long draftId, String topic, String status,
        boolean loadable, LocalDateTime occurredAt, String errorMessage
) {}

public record PublishDraftRequest(PostCreateRequest post) {}
```

엔드포인트는 `GET /runs`, `GET /drafts/{id}`, `POST /drafts/{id}/publish`를 사용한다. 게시 메서드에는 `@Transactional`을 적용해 게시글 생성과 상태 전환을 원자적으로 처리한다.

- [x] **Step 4: 대상 테스트 통과 확인**

Run: `cd devnote-webapp && ./gradlew test --tests "*AiAutoPostingAdminServiceTest" --tests "*AiAutoPostingControllerTest"`

Expected: 대상 테스트 PASS.

- [x] **Step 5: 커밋**

```bash
git add devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai
git commit -m "feat: AI 임시저장 조회 및 게시 API 추가"
```

### Task 3: 프런트 API 계약과 화면 복원

**Files:**
- Modify: `devnote/src/types.ts`
- Modify: `devnote/src/api/aiPosts.ts`
- Modify: `devnote/src/api/aiAutoPosting.ts`
- Modify: `devnote/src/pages/admin/AdminAiPostingPage.tsx`
- Modify: `devnote/tests/aiPostsApi.test.mjs`
- Modify: `devnote/tests/adminAiPostingManagement.test.mjs`
- Create: `devnote/tests/aiPostDraftApi.test.mjs`

- [x] **Step 1: 프런트 실패 테스트 작성**

API 테스트는 생성 응답의 `draftId`, 초안 상세 조회, 게시 URL과 본문을 검증한다.

```javascript
assert.equal(response.draftId, 41);
assert.equal(calls[1].url, '/api/admin/ai-posting/drafts/41');
assert.equal(calls[2].url, '/api/admin/ai-posting/drafts/41/publish');
```

화면 소스 테스트는 `activeDraftId`, `getAiPostingDraft`, `publishAiPostingDraft`, `run.loadable` 분기를 검증한다.

- [x] **Step 2: 실패 확인**

Run: `cd devnote && node tests/aiPostsApi.test.mjs && node tests/aiPostDraftApi.test.mjs && node tests/adminAiPostingManagement.test.mjs`

Expected: 새 타입/함수/화면 상태가 없어 assertion 실패.

- [x] **Step 3: API와 화면 최소 구현**

생성 성공 시 `activeDraftId`를 설정하고 자동화 데이터를 새로고침한다. 임시저장 클릭 시 상세 응답으로 주제, 편집 폼, 태그, 추천 데이터를 교체한다. 저장 시 활성 ID가 있으면 다음 호출을 사용한다.

```typescript
const savedPost = activeDraftId
  ? await publishAiPostingDraft(activeDraftId, request)
  : await createPost(request);
```

이력 항목은 `run.topic`만 표시하고 `run.loadable`일 때만 클릭 가능한 `button`으로 렌더링한다.

- [x] **Step 4: 대상 테스트와 빌드 통과 확인**

Run: `cd devnote && node tests/aiPostsApi.test.mjs && node tests/aiPostDraftApi.test.mjs && node tests/adminAiPostingManagement.test.mjs && npm run build`

Expected: 테스트 PASS, TypeScript/Vite build 성공.

- [x] **Step 5: 커밋**

```bash
git add devnote/src devnote/tests
git commit -m "feat: AI 임시저장 불러오기 화면 구현"
```

### Task 4: 회귀 검증과 문서 상태 정리

**Files:**
- Modify: `docs/superpowers/plans/2026-06-23-ai-post-draft-reload.md`

- [x] **Step 1: 백엔드 전체 테스트 실행**

Run: `cd devnote-webapp && ./gradlew test`

Expected: 전체 테스트 PASS.

- [x] **Step 2: 프런트 전체 테스트·정적 검사 실행**

Run: `cd devnote && Get-ChildItem tests -Filter *.test.mjs | ForEach-Object { node $_.FullName }`

Expected: 모든 Node 테스트 종료 코드 0.

Run: `cd devnote && npm run lint && npm run build`

Expected: lint와 build 성공.

- [x] **Step 3: 변경 범위 확인**

Run: `git diff --check && git status --short`

Expected: 공백 오류 없음. 사용자 소유 `.tools/`는 변경하거나 스테이징하지 않는다.

- [x] **Step 4: 계획 체크박스와 최종 상태 커밋**

완료한 체크박스를 `[x]`로 변경한 뒤 다음을 실행한다.

```bash
git add docs/superpowers/plans/2026-06-23-ai-post-draft-reload.md
git commit -m "docs: AI 임시저장 구현 계획 완료"
```
