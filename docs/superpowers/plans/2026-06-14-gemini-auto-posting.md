# Gemini Auto Posting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and publish one Gemini-written development post at 06:00 Asia/Seoul each day while rotating administrator-managed database topics.

**Architecture:** Add a focused `ai.autopost` domain for topic and run persistence, orchestration, scheduling, and admin APIs. Keep Gemini behind the existing `AiPostClient` boundary, extend its request context for duplicate avoidance, and reuse `PostService` for final publication. Extend the existing admin AI posting page with status, topic management, manual execution, and run history.

**Tech Stack:** Java 21, Spring Boot 4, Spring Data JPA, Google Gen AI Java SDK, React 19, TypeScript, Tailwind CSS.

---

### Task 1: Topic and run persistence

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostTopic.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostRun.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostRunStatus.java`
- Create: repository interfaces in the same package
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostTopicSelectionServiceTest.java`

- [ ] Write failing tests proving enabled topics are selected by never-used first, then oldest success time, then display order.
- [ ] Run `gradlew.bat test --tests "*AiPostTopicSelectionServiceTest"` and confirm missing types fail.
- [ ] Implement entities, repositories, and `AiPostTopicSelectionService`.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Gemini request and structured response

**Files:**
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/AiPostClient.java`
- Replace: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/OpenAiPostClient.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/MockAiPostClient.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/service/AiPostGenerateService.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/AiPostGenerateServiceTest.java`

- [ ] Add failing tests showing direction, keywords, difficulty, length, category, and recent titles are included in generation context.
- [ ] Run the focused tests and verify failure.
- [ ] Introduce `AiPostGenerationContext`, generate a strict JSON prompt, and implement Gemini structured JSON generation using `GEMINI_API_KEY` and `GEMINI_MODEL`.
- [ ] Keep a conditional Mock client for development when no API key is configured, and validate all response fields.
- [ ] Re-run focused tests.

### Task 3: Scheduled publication orchestration

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingService.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingScheduler.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/post/PostService.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/post/PostRepository.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingServiceTest.java`

- [ ] Write failing tests for successful publication, daily duplicate skip, failure recording, recent-title forwarding, and slug collision handling.
- [ ] Run tests and verify the expected failures.
- [ ] Implement one orchestration transaction, reusable post creation, deterministic slug generation, and the 06:00 scheduler.
- [ ] Re-run focused tests.

### Task 4: Admin API and configuration

**Files:**
- Create: controller, DTO, and management service files under `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/`
- Modify: `devnote-webapp/src/main/resources/application.properties`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/config/SecurityConfig.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingControllerTest.java`

- [ ] Write controller tests for status, topic CRUD/order, run history, and manual execution.
- [ ] Run tests and verify failure.
- [ ] Implement `/api/admin/ai-posting/**`, environment-backed properties, sanitized failure responses, and scheduler enablement.
- [ ] Re-run focused tests.

### Task 5: Admin frontend

**Files:**
- Create: `devnote/src/api/aiAutoPosting.ts`
- Modify: `devnote/src/types.ts`
- Modify: `devnote/src/pages/admin/AdminAiPostingPage.tsx`
- Create: `devnote/tests/adminAiPostingManagement.test.mjs`

- [ ] Add a failing source-level UI test for status, topic management, manual execution, and history sections.
- [ ] Run `node tests/adminAiPostingManagement.test.mjs` and verify failure.
- [ ] Add typed API calls and compact management sections while preserving manual generation, editing, preview, and save.
- [ ] Pass all frontend source tests, lint, and build.

### Task 6: System verification

**Files:**
- Modify if required: test fixtures and configuration only.

- [ ] Run `gradlew.bat test`.
- [ ] Run `npm run lint`, all `node tests/*.test.mjs`, and `npm run build`.
- [ ] Start backend and frontend development servers with automatic posting disabled.
- [ ] Open `http://localhost:5173/admin/ai-posting`, verify layout and interactions in the browser, and check the browser console.
- [ ] Review `git diff --check` and the final diff for secret leakage and unrelated changes.
