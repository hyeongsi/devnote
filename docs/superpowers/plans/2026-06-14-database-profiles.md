# Database Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run local development and automated tests against isolated H2 in-memory databases and deployed applications against MySQL.

**Architecture:** Keep application-wide settings in the base properties file and make `local` the default profile. Place H2 settings in dedicated local and test profiles, place environment-driven MySQL settings in the production profile, and keep H2 out of the production archive with Gradle's development-only configuration.

**Tech Stack:** Spring Boot, Spring Data JPA, H2, MySQL Connector/J, JUnit 5

---

### Task 1: Verify profile configuration requirements

**Files:**
- Create: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/config/DatabaseProfileConfigurationTest.java`

- [x] Write a test that loads the test and production property resources.
- [x] Assert that test configuration uses H2 and `create-drop`.
- [x] Assert that production configuration uses MySQL environment variables and disables SQL seed initialization.
- [x] Run the test and verify it fails while profile files are missing.

### Task 2: Split test and production database settings

**Files:**
- Modify: `devnote-webapp/src/main/resources/application.properties`
- Create: `devnote-webapp/src/main/resources/application-test.properties`
- Create: `devnote-webapp/src/main/resources/application-local.properties`
- Create: `devnote-webapp/src/main/resources/application-prod.properties`
- Modify: `devnote-webapp/build.gradle`

- [x] Remove database-specific settings from the common configuration.
- [x] Make the local H2 profile the default for developer runs.
- [x] Configure H2 in-memory storage and schema recreation for tests.
- [x] Configure MySQL from deployment environment variables for production.
- [x] Activate the `test` profile automatically through the Gradle test task.
- [x] Change H2 from a production runtime dependency to a test runtime dependency.

### Task 3: Verify both configurations

**Files:**
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/config/DatabaseProfileConfigurationTest.java`

- [x] Run the focused profile configuration test.
- [x] Run the complete backend test suite.
- [x] Build the executable Spring Boot JAR.
- [x] Review the final diff for secrets and unrelated files.
