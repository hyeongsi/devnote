# Production Observability Logs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add low-noise production logs for backend startup, AI generation/autoposting/draft flows, and minimal request error visibility.

**Architecture:** Use Spring Boot console logging and SLF4J loggers in the existing services. Add a small startup listener and a single request error filter with clear boundaries and no sensitive payload logging.

**Tech Stack:** Java 21, Spring Boot 4, JUnit 5, Spring Boot output capture, SLF4J.

---

### Task 1: Startup and console logging

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/config/StartupLoggingListener.java`
- Modify: `devnote-webapp/src/main/resources/application-prod.properties`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/config/StartupLoggingListenerTest.java`

- [x] Write a failing test that the listener logs active profiles, AI auto-posting enabled state, and Gemini configured state.
- [x] Implement the listener with `ApplicationReadyEvent`.
- [x] Add a concise prod console pattern.
- [x] Run the targeted test.

### Task 2: AI workflow event logs

**Files:**
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/service/AiPostGenerateService.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingScheduler.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingService.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingAdminService.java`
- Test: existing AI service tests plus source-level log contract tests where direct output capture would make tests brittle.

- [x] Add tests that assert the expected log event names exist in the relevant services.
- [x] Add `INFO` start/success/skip logs and `ERROR` failure logs without payloads.
- [x] Run targeted AI tests.

### Task 3: Minimal request error logs

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/config/RequestErrorLoggingFilter.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/config/RequestErrorLoggingFilterTest.java`

- [x] Write failing tests for 5xx response logging, exception logging, and 4xx silence.
- [x] Implement `OncePerRequestFilter`.
- [x] Run targeted config tests.

### Task 4: Verification

**Files:**
- All changed backend files.

- [x] Run `cd devnote-webapp && .\gradlew.bat test`.
- [x] Inspect git diff and ensure unrelated `Post.java` local change is not staged.
- [ ] Commit only the observability log changes.
