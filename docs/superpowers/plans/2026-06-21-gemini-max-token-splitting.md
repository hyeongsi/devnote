# Gemini MAX_TOKENS Splitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve completed Gemini content while recursively splitting only generation units that end with `MAX_TOKENS`.

**Architecture:** Extend the structured post plan with ordered child units, represent generated content as an immutable tree, and recursively replace a failed leaf with smaller child units. `GeminiAiPostClient` remains the orchestrator, while focused package-private records own split-plan validation, tree traversal, rendering, and call-budget enforcement.

**Tech Stack:** Java 21, Spring Boot 4, Google Gen AI Java SDK 1.58, Jackson, SLF4J, JUnit 5, AssertJ

---

### Task 0: Enforce Gemini Provider Request Limits

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiRequestRateLimiter.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiRequestRateLimiterTest.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] Write failing tests using a mutable `Clock`: requests 1-5 in a rolling minute pass, request 6 fails, and a request passes after the oldest timestamp reaches 60 seconds.
- [ ] Write failing tests: requests 1-20 on an Asia/Seoul calendar day pass, request 21 fails, and the counter resets at the next Seoul midnight.
- [ ] Implement a synchronized in-memory limiter with fixed limits of 5 requests per rolling minute and 20 requests per Seoul calendar day.
- [ ] Call the limiter immediately before every `gateway.generate` attempt inside `GeminiAiPostClient.invoke`, including HTTP 429 retries.
- [ ] Verify a rejected request never reaches the fake gateway and reports whether the minute or daily limit was exhausted.
- [ ] Run `./gradlew test --tests '*GeminiRequestRateLimiterTest' --tests '*GeminiAiPostClientTest'`.
- [ ] Commit as `feat: enforce Gemini request limits`.

---

### Task 1: Configure Split Safety Limits

**Files:**
- Modify: `devnote-webapp/src/main/resources/application.properties`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/AiPostClientConfig.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/AiPostClientConfigTest.java`

- [ ] **Step 1: Write the failing configuration test**

Change the test to construct the bean with all generation limits and assert each field:

```java
@Test
void passesConfiguredGenerationLimitsToGeminiClient() {
    AiPostClient client = new AiPostClientConfig().aiPostClient(
            "api-key",
            "gemini-2.5-flash",
            24_576,
            3,
            55
    );

    assertThat(client)
            .isInstanceOf(GeminiAiPostClient.class)
            .extracting("maxOutputTokens", "maxSplitDepth", "maxGenerationCalls")
            .containsExactly(24_576, 3, 55);
}
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd devnote-webapp
./gradlew test --tests '*AiPostClientConfigTest'
```

Expected: compilation fails because `aiPostClient` does not accept the two new limits.

- [ ] **Step 3: Add properties and constructor wiring**

Add these properties:

```properties
devnote.ai.gemini.max-split-depth=${GEMINI_MAX_SPLIT_DEPTH:2}
devnote.ai.gemini.max-generation-calls=${GEMINI_MAX_GENERATION_CALLS:40}
```

Inject them in `AiPostClientConfig.aiPostClient`:

```java
AiPostClient aiPostClient(
        @Value("${devnote.ai.gemini.api-key:}") String apiKey,
        @Value("${devnote.ai.gemini.model:gemini-2.5-flash}") String model,
        @Value("${devnote.ai.gemini.max-output-tokens:16384}") int maxOutputTokens,
        @Value("${devnote.ai.gemini.max-split-depth:2}") int maxSplitDepth,
        @Value("${devnote.ai.gemini.max-generation-calls:40}") int maxGenerationCalls
) {
    if (apiKey == null || apiKey.isBlank()) {
        return new MockAiPostClient();
    }
    return new GeminiAiPostClient(
            apiKey,
            model,
            new ObjectMapper(),
            maxOutputTokens,
            maxSplitDepth,
            maxGenerationCalls
    );
}
```

Store and validate positive limits in every `GeminiAiPostClient` constructor. Keep package-private test constructors accepting a fake gateway and sleeper.

- [ ] **Step 4: Run the test and verify GREEN**

Run `./gradlew test --tests '*AiPostClientConfigTest'`.

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Commit**

```bash
git add devnote-webapp/src/main/resources/application.properties \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/AiPostClientConfig.java \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java \
  devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/AiPostClientConfigTest.java
git commit -m "feat: configure Gemini split safety limits"
```

### Task 2: Generate Ordered Child Units

**Files:**
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiPostPlan.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiGeneratedUnit.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] **Step 1: Write a failing ordered-unit test**

Update `planJson()` so every section has `units`, then add a test with two units under one section:

```java
@Test
void generatesAndAssemblesChildUnitsInPlanOrder() {
    FakeGateway gateway = new FakeGateway(
            result(planWithUnitsJson(), "STOP"),
            result("환경변수 본문", "STOP"),
            result("systemd 본문", "STOP"),
            result(successfulReviewJson(), "STOP")
    );

    AiPostGenerateResponse response = client(gateway).generate(context());

    assertThat(response.content()).isEqualTo("""
            ## 운영 환경 적용

            ### 환경변수 구성

            환경변수 본문

            ### systemd 설정

            systemd 본문""");
    assertThat(gateway.promptsFor("ops/env")).hasSize(1);
    assertThat(gateway.promptsFor("ops/systemd")).hasSize(1);
}
```

Make `FakeGateway.promptsFor` select prompts containing `contentKey: <key>`.

- [ ] **Step 2: Run the test and verify RED**

Run `./gradlew test --tests '*GeminiAiPostClientTest.generatesAndAssemblesChildUnitsInPlanOrder'`.

Expected: plan parsing or assembly assertion fails because units are unsupported.

- [ ] **Step 3: Extend the plan and add the generated tree record**

Define units in `GeminiPostPlan`:

```java
record Section(String key, String heading, String brief, List<Unit> units) {
}

record Unit(String key, String heading, String brief) {
}
```

Create `GeminiGeneratedUnit`:

```java
record GeminiGeneratedUnit(
        String contentKey,
        String heading,
        String brief,
        int depth,
        String markdown,
        List<GeminiGeneratedUnit> children
) {
    static GeminiGeneratedUnit completed(
            String contentKey, String heading, String brief, int depth, String markdown
    ) {
        return new GeminiGeneratedUnit(contentKey, heading, brief, depth, markdown.strip(), List.of());
    }

    static GeminiGeneratedUnit branch(
            String contentKey, String heading, String brief, int depth, List<GeminiGeneratedUnit> children
    ) {
        return new GeminiGeneratedUnit(contentKey, heading, brief, depth, null, List.copyOf(children));
    }

    boolean leaf() {
        return children.isEmpty();
    }

    List<GeminiGeneratedUnit> leaves() {
        return leaf()
                ? List.of(this)
                : children.stream().flatMap(child -> child.leaves().stream()).toList();
    }

    GeminiGeneratedUnit replaceLeaf(String key, GeminiGeneratedUnit replacement) {
        if (leaf()) {
            return contentKey.equals(key) ? replacement : this;
        }
        return branch(contentKey, heading, brief, depth,
                children.stream().map(child -> child.replaceLeaf(key, replacement)).toList());
    }
}
```

- [ ] **Step 4: Generate units and render Markdown**

Validate that every section has 1-5 units and all combined `contentKey` values are unique. Generate each initial unit once, store it as a completed tree node, and render:

```java
private String assemble(GeminiPostPlan plan, Map<String, List<GeminiGeneratedUnit>> sections) {
    return plan.sections().stream()
            .map(section -> renderSection(section, sections.get(section.key())))
            .collect(Collectors.joining("\n\n"));
}

private String renderSection(GeminiPostPlan.Section section, List<GeminiGeneratedUnit> units) {
    String body = units.size() == 1
            ? renderUnit(units.getFirst(), false)
            : units.stream().map(unit -> renderUnit(unit, true)).collect(Collectors.joining("\n\n"));
    return "## " + section.heading() + "\n\n" + body;
}
```

`renderUnit` emits `###` for initial units and `####` for split children, then recursively renders children in order.

- [ ] **Step 5: Update JSON schema and prompts**

Add a required `units` array with required `key`, `heading`, and `brief` fields to `planSchema()`. Update the plan prompt to require 1-5 units per section and globally unique keys. Update the generation prompt to include both `sectionKey` and `contentKey`.

- [ ] **Step 6: Run all client tests and verify GREEN**

Run `./gradlew test --tests '*GeminiAiPostClientTest'`.

Expected: all tests pass after existing fixtures include units.

- [ ] **Step 7: Commit**

```bash
git add devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiPostPlan.java \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiGeneratedUnit.java \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java \
  devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java
git commit -m "feat: generate Gemini posts by child unit"
```

### Task 3: Recursively Split Only MAX_TOKENS Units

**Files:**
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiUnitSplitPlan.java`
- Create: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiGenerationBudget.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] **Step 1: Write a failing selective split test**

Queue one completed sibling, one `MAX_TOKENS` result, a split plan, and two successful children:

```java
@Test
void splitsOnlyTheUnitThatReachedMaxTokensAndPreservesCompletedSiblings() {
    FakeGateway gateway = new FakeGateway(
            result(planWithUnitsJson(), "STOP"),
            result("보존할 환경변수 본문", "STOP"),
            result("잘린 systemd 본문", "MAX_TOKENS"),
            result(splitPlanJson(), "STOP"),
            result("서비스 파일 본문", "STOP"),
            result("재시작 본문", "STOP"),
            result(successfulReviewJson(), "STOP")
    );

    AiPostGenerateResponse response = client(gateway).generate(context());

    assertThat(response.content())
            .contains("보존할 환경변수 본문", "서비스 파일 본문", "재시작 본문")
            .doesNotContain("잘린 systemd 본문");
    assertThat(gateway.promptsFor("ops/env")).hasSize(1);
    assertThat(gateway.promptsFor("ops/systemd")).hasSize(1);
}
```

- [ ] **Step 2: Run the selective split test and verify RED**

Run the single test. Expected: `IllegalStateException` with `finishReason=MAX_TOKENS`.

- [ ] **Step 3: Add split-plan validation and call budget**

Create records:

```java
record GeminiUnitSplitPlan(List<Unit> units) {
    record Unit(String key, String heading, String brief) {
    }
}
```

```java
final class GeminiGenerationBudget {
    private final int maximum;
    private int used;

    GeminiGenerationBudget(int maximum) {
        this.maximum = maximum;
    }

    void consume(String stage, String contentKey) {
        if (++used > maximum) {
            throw new IllegalStateException(
                    "Gemini generation call limit exceeded: stage=" + stage + ", contentKey=" + contentKey
            );
        }
    }

    int used() {
        return used;
    }
}
```

Count only content-generation and repair calls toward this budget. Planning, split planning, and review calls remain bounded separately by workflow structure.

- [ ] **Step 4: Implement recursive generation**

Replace the one-time retry with:

```java
private GeminiGeneratedUnit generateUnit(
        AiPostGenerationContext context,
        GeminiPostPlan plan,
        GeminiPostPlan.Section section,
        String contentKey,
        String heading,
        String brief,
        int depth,
        GeminiGenerationBudget budget
) {
    budget.consume("UNIT_GENERATION", contentKey);
    GeminiModelResult result = invoke(() -> gateway.generate(
            buildUnitPrompt(context, plan, section, contentKey, heading, brief),
            markdownConfig()
    ));
    logResult("UNIT_GENERATION", section.key(), contentKey, depth, result, budget.used());

    if ("STOP".equals(result.finishReason())) {
        return GeminiGeneratedUnit.completed(contentKey, heading, brief, depth, result.text());
    }
    if (!"MAX_TOKENS".equals(result.finishReason())) {
        throw incomplete("UNIT_GENERATION", contentKey, depth, result.finishReason());
    }
    if (depth >= maxSplitDepth) {
        throw incomplete("UNIT_SPLIT_DEPTH", contentKey, depth, result.finishReason());
    }

    GeminiUnitSplitPlan split = requestSplitPlan(section, contentKey, heading, brief, depth);
    validateSplitPlan(contentKey, split);
    List<GeminiGeneratedUnit> children = split.units().stream()
            .map(unit -> generateUnit(
                    context, plan, section,
                    contentKey + "/" + unit.key(), unit.heading(), unit.brief(), depth + 1, budget
            ))
            .toList();
    return GeminiGeneratedUnit.branch(contentKey, heading, brief, depth, children);
}
```

Split validation requires 2-5 children, nonblank fields, unique child keys, and child keys different from the parent suffix.

- [ ] **Step 5: Add diagnostic logging**

Add an SLF4J logger and log only metadata:

```java
log.info(
        "Gemini generation stage={} sectionKey={} contentKey={} depth={} finishReason={} responseChars={} generationCalls={}",
        stage, sectionKey, contentKey, depth, finishReason, responseChars, calls
);
```

Never log prompts, generated article text, or the API key.

- [ ] **Step 6: Add boundary tests**

Add tests for:

- a child reaching `MAX_TOKENS` and splitting at depth 2;
- depth 2 reaching `MAX_TOKENS` and throwing an exception containing stage, key, depth, and reason;
- exceeding `maxGenerationCalls` while preserving the diagnostic key;
- empty, one-child, and duplicate-key split plans being rejected;
- `SAFETY` not triggering a split call.

Run `./gradlew test --tests '*GeminiAiPostClientTest'` and expect all tests to pass.

- [ ] **Step 7: Commit**

```bash
git add devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiUnitSplitPlan.java \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiGenerationBudget.java \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java \
  devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java
git commit -m "feat: split Gemini output on token limits"
```

### Task 4: Review and Repair Leaf Units

**Files:**
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiPostReview.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiGeneratedUnit.java`
- Modify: `devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java`
- Test: `devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java`

- [ ] **Step 1: Write a failing leaf-repair test**

Return a review issue for one `contentKey` and assert only that leaf is replaced:

```java
@Test
void repairsOnlyTheRejectedLeafAndPreservesOtherGeneratedUnits() {
    FakeGateway gateway = new FakeGateway(
            result(planWithUnitsJson(), "STOP"),
            result("보존할 본문", "STOP"),
            result("수정 전 본문", "STOP"),
            result(failedReviewJson("ops/systemd"), "STOP"),
            result("수정 완료 본문", "STOP"),
            result(successfulReviewJson(), "STOP")
    );

    AiPostGenerateResponse response = client(gateway).generate(context());

    assertThat(response.content())
            .contains("보존할 본문", "수정 완료 본문")
            .doesNotContain("수정 전 본문");
    assertThat(gateway.promptsFor("ops/env")).hasSize(1);
}
```

- [ ] **Step 2: Run the test and verify RED**

Expected: review parsing or unknown-key handling fails because issues still use `sectionKey`.

- [ ] **Step 3: Change review issues to content keys**

Change the record and schema:

```java
record Issue(String contentKey, String type, String severity, String instruction) {
}
```

The review prompt lists every leaf as `contentKey=heading` and requires each error to reference one listed key.

- [ ] **Step 4: Replace only the rejected leaf**

Find the leaf by `contentKey`, generate its replacement with the existing repair prompt, and call `replaceLeaf` on the containing top-level tree. If repair returns `MAX_TOKENS`, invoke the same split-and-generate path used by normal unit generation instead of retrying the whole section.

Reject review issues that reference a branch or unknown key. Preserve the second-review failure policy.

- [ ] **Step 5: Run focused and full backend verification**

Run:

```bash
./gradlew test --tests '*GeminiAiPostClientTest'
./gradlew test --tests '*AiPostClientConfigTest'
./gradlew test
```

Expected: all commands finish with `BUILD SUCCESSFUL`.

- [ ] **Step 6: Inspect final scope**

Run:

```bash
git diff --check
git status --short
```

Verify no controller, frontend, Nginx, database entity, or API DTO changed.

- [ ] **Step 7: Commit**

```bash
git add devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiPostReview.java \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiGeneratedUnit.java \
  devnote-webapp/src/main/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClient.java \
  devnote-webapp/src/test/java/io/hyeongsi/devnotewebapp/ai/client/GeminiAiPostClientTest.java
git commit -m "feat: repair Gemini content by generated leaf"
```
