# Gemini Section Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate long Gemini blog posts section by section, repair only failed sections, and assemble one final Markdown post without persisting intermediate sections.

**Architecture:** `GeminiAiPostClient` orchestrates a small structured planning call, one plain-Markdown call per planned section, and a small structured review call. Generated sections live in an in-memory ordered map for the duration of one request; failed sections are regenerated once by stable section key and the final post content is assembled only after review succeeds.

**Tech Stack:** Java 21, Spring Boot 4, Google Gen AI Java SDK 1.58, Jackson, JUnit 5, AssertJ

---

### Task 1: Isolate the Gemini SDK boundary

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiModelGateway.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiModelResult.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/AiPostClientConfig.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] Write a failing test that injects a fake gateway and verifies generation calls can be supplied without the real Gemini API.
- [ ] Run `./gradlew test --tests '*GeminiAiPostClientTest'` and verify compilation or assertion failure.
- [ ] Add a gateway returning `GeminiModelResult(text, finishReason)` and wire the production SDK adapter through `GeminiAiPostClient`.
- [ ] Add `devnote.ai.gemini.max-output-tokens=${GEMINI_MAX_OUTPUT_TOKENS:16384}` and inject it from `AiPostClientConfig`.
- [ ] Run the focused test and verify it passes.

### Task 2: Generate and assemble sections

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiPostPlan.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] Write a failing test with a plan containing stable section keys and queued raw Markdown section responses.
- [ ] Verify the test fails because the current client performs one JSON generation call.
- [ ] Parse the small plan JSON, call Gemini once per section, keep section content in insertion order, and assemble headings plus Markdown into `AiPostGenerateResponse.content`.
- [ ] Reject empty section responses and non-`STOP` finish reasons; retry `MAX_TOKENS` once with a completion-focused prompt.
- [ ] Run the focused tests and verify ordered assembly and retry behavior pass.

### Task 3: Review and selectively repair sections

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiPostReview.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] Write a failing test where review identifies one section key and the gateway returns replacement Markdown for only that section.
- [ ] Verify the test fails because review and repair are not implemented.
- [ ] Parse the review JSON, regenerate only sections with `ERROR` issues, replace their in-memory content, and review the assembled article a second time.
- [ ] Return the article after a successful review; throw a diagnostic exception after a second failed review or an unknown section key.
- [ ] Verify unaffected sections are not regenerated and the repaired content is assembled in the original order.

### Task 4: Rate-limit resilience and verification

**Files:**
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] Add a failing test for a gateway rate-limit exception followed by success.
- [ ] Add bounded exponential retry delays for HTTP 429 responses while leaving invalid content failures non-retryable.
- [ ] Run `./gradlew test --tests '*GeminiAiPostClientTest'`.
- [ ] Run the complete backend test suite with `./gradlew test`.
- [ ] Inspect `git diff --check` and `git status --short` before reporting completion.
