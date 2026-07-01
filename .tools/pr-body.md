## What changed
- Added a new `devnote-webapp/` Spring Boot application scaffold
- Included Gradle wrapper and project build configuration
- Added a basic application entrypoint and context-load test

## Why it changed
- Establishes the initial backend/webapp project structure for the `devnote` repository

## Impact
- Introduces a standalone Spring Boot app under `devnote-webapp/`
- Makes the project runnable and ready for follow-up feature work

## Root cause
- The repository did not yet contain the new webapp project structure

## Validation
- Ran `.\gradlew.bat test` in `devnote-webapp/` and the test suite passed
