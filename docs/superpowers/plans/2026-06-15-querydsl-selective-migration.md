# Selective QueryDSL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move dashboard aggregation and AI auto-posting compound queries from Spring Data derived/JPQL queries to explicit QueryDSL queries.

**Architecture:** Add focused custom repository contracts and QueryDSL implementations beside the existing repositories. Keep `JpaRepository` for persistence and simple CRUD while services consume QueryDSL-backed methods for aggregation, grouped traffic, ordering, limits, and compound predicates.

**Tech Stack:** Spring Boot, Spring Data JPA, QueryDSL JPA, JUnit 5, H2

---

### Task 1: Dashboard QueryDSL repository

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/dashboard/DashboardQueryRepository.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/dashboard/DashboardQueryRepositoryImpl.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/dashboard/DashboardService.java`
- Modify: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/dashboard/DashboardServiceTest.java`

- [x] Change service tests to require a dashboard query repository.
- [x] Verify compilation fails before the repository exists.
- [x] Implement QueryDSL statistics, daily traffic grouping, and recent activity queries.
- [x] Update the service to fill missing traffic dates while delegating database work.
- [x] Run dashboard tests.

### Task 2: AI auto-posting QueryDSL repositories

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostTopicRepositoryCustom.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostTopicRepositoryImpl.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostRunRepositoryCustom.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostRunRepositoryImpl.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostTopicRepository.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiPostRunRepository.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingService.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/autopost/AiAutoPostingAdminService.java`

- [x] Add custom contracts for next-topic selection and run predicates/history.
- [x] Implement each contract with QueryDSL ordering, limits, and predicates.
- [x] Remove replaced derived query methods.
- [x] Update services to use the custom methods.
- [x] Run AI auto-posting tests.

### Task 3: Regression verification

**Files:**
- Modify only if required by compilation or test failures.

- [x] Run the complete backend test suite.
- [x] Build the production JAR.
- [x] Run `git diff --check`.
- [x] Confirm simple CRUD and slug existence methods remain Spring Data JPA.
