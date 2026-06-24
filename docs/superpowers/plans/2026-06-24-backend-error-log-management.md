# Backend Error Log Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record backend 5xx failures in the database and expose an admin UI to inspect error log summaries and stack traces.

**Architecture:** Add a focused `errorlog` backend package with an entity, repository, recorder service, admin service, and admin controller. Use `@ControllerAdvice` for MVC exceptions and keep `RequestErrorLoggingFilter` as a 5xx response safety net with a request attribute to prevent duplicate records. Add frontend API/types and an `/admin/error-logs` page with list and detail panes.

**Tech Stack:** Spring Boot 4, Spring MVC, Spring Data JPA, H2/MySQL-compatible JPA schema generation, React 19, TypeScript, lucide-react.

---

### Task 1: Backend Persistence And Admin API

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLog.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLogRepository.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLogDtos.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLogRecorder.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLogAdminService.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLogAdminController.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLogAdminServiceTest.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/errorlog/ErrorLogAdminControllerTest.java`

- [ ] Write failing service tests proving newest-first summaries and detail lookup.
- [ ] Run the new service test and confirm it fails because classes do not exist.
- [ ] Implement the entity, repository, DTOs, and admin service.
- [ ] Run the service test and confirm it passes.
- [ ] Write failing controller tests for `GET /api/admin/error-logs` and `GET /api/admin/error-logs/{id}`.
- [ ] Run the controller test and confirm it fails because the controller does not exist.
- [ ] Implement the controller.
- [ ] Run the controller test and confirm it passes.

### Task 2: 5xx Recording Hooks

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/errorlog/AdminExceptionLoggingAdvice.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/config/RequestErrorLoggingFilter.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/errorlog/AdminExceptionLoggingAdviceTest.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/config/RequestErrorLoggingFilterTest.java`

- [ ] Write failing advice tests proving runtime exceptions are recorded once as 500 responses and client-side `ResponseStatusException` 4xx responses are not recorded.
- [ ] Run the advice test and confirm it fails because the advice does not exist.
- [ ] Implement `AdminExceptionLoggingAdvice` that records 5xx errors and returns a compact error body.
- [ ] Run the advice test and confirm it passes.
- [ ] Update the filter test to inject a mocked recorder and prove final 5xx responses are recorded only when the advice has not already marked the request.
- [ ] Run the filter test and confirm it fails against the old constructor.
- [ ] Modify `RequestErrorLoggingFilter` to accept `ErrorLogRecorder`, record 5xx responses, and respect the duplicate-prevention request attribute.
- [ ] Run the filter test and confirm it passes.

### Task 3: Admin Menu Seed And Frontend API

**Files:**
- Modify: `devnote-webapp/src/main/resources/data.sql`
- Create: `devnote/src/api/errorLogs.ts`
- Modify: `devnote/src/types.ts`
- Test: `devnote/tests/adminErrorLogsApi.test.mjs`
- Test: `devnote/tests/adminMenuTree.test.mjs`

- [ ] Write failing frontend API/source tests proving `/api/admin/error-logs` endpoints and the `/admin/error-logs` seeded menu exist.
- [ ] Run the tests and confirm they fail.
- [ ] Add error log TypeScript types and API functions.
- [ ] Add the seeded admin menu item with path `/admin/error-logs`.
- [ ] Run the tests and confirm they pass.

### Task 4: Admin Error Log Page

**Files:**
- Create: `devnote/src/pages/admin/AdminErrorLogsPage.tsx`
- Modify: `devnote/src/App.tsx`
- Modify: `devnote/src/features/admin/AdminSidebar.tsx`
- Test: `devnote/tests/adminErrorLogsPage.test.mjs`

- [ ] Write failing source-level UI tests proving the route, sidebar icon mapping, list fetch, and detail fetch are wired.
- [ ] Run the UI test and confirm it fails.
- [ ] Implement `AdminErrorLogsPage` with a dense list and detail pane showing stack trace text.
- [ ] Register the route and sidebar icon mapping.
- [ ] Run the UI test and confirm it passes.

### Task 5: Verification

**Files:**
- No new files.

- [ ] Run backend targeted tests: `./gradlew test --tests "*ErrorLog*" --tests "*RequestErrorLoggingFilterTest"`.
- [ ] Run frontend targeted tests: `node tests/adminErrorLogsApi.test.mjs`, `node tests/adminErrorLogsPage.test.mjs`, `node tests/adminMenuTree.test.mjs`.
- [ ] Run frontend type/build verification: `npm.cmd run build`.
- [ ] Run `git status -sb` and confirm only intended files plus pre-existing `.tools/` are present.
