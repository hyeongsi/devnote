# Gemini Request Rate Limits Design

## Goal

Keep every Gemini API request within five requests per rolling minute and twenty requests per Asia/Seoul calendar day while preserving the existing synchronous posting workflow.

## Scope

- Planning, content generation, split planning, review, repair, and HTTP 429 retries share the same limits.
- Limits apply to the singleton `GeminiAiPostClient`, not separately to each post-generation request.
- Counters remain in memory and reset when the application restarts.
- No controller, frontend, database, scheduler, or Nginx behavior changes.

## Design

`GeminiRequestRateLimiter` owns a queue of successful request-admission timestamps and a Seoul calendar-day counter. Its synchronized `acquire()` method first removes timestamps that are at least 60 seconds old, then resets the daily counter when the Seoul date changes. It rejects a request before the gateway call when either limit is exhausted; otherwise, it records the request immediately.

`GeminiAiPostClient.invoke()` calls the limiter immediately before every `gateway.generate` attempt. This central placement covers JSON planning, Markdown generation, recursive split requests, review, repair, and each HTTP 429 retry without duplicating checks throughout the workflow.

The minute limit is a rolling window rather than a clock-minute bucket. The daily limit resets at midnight in `Asia/Seoul`. Rejection is immediate; the synchronous request does not wait for a future window.

Scheduled auto posting keeps its default request footprint below the minute limit by using a compact generation context: at most two recent titles, the `간결하게` length hint, two planned sections, and one generation unit per section. Manual generation uses the same conservative Gemini client defaults unless environment variables raise the section or unit limits.

## Error Handling

Limit failures identify `minute` or `daily` exhaustion and current usage. They do not include prompts, generated content, or the API key. A rejected attempt never reaches Gemini and is not retried by the existing HTTP 429 policy.

## Testing

- Requests 1 through 5 inside 60 seconds are admitted; request 6 is rejected.
- A request is admitted when the oldest minute-window timestamp reaches 60 seconds.
- Requests 1 through 20 on one Seoul date are admitted; request 21 is rejected.
- The daily counter resets at the next Seoul midnight.
- `GeminiAiPostClient` does not invoke the gateway after a rate-limit rejection.
