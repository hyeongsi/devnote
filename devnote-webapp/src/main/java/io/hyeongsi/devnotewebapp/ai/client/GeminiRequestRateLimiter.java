package io.hyeongsi.devnotewebapp.ai.client;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayDeque;
import java.util.Deque;

final class GeminiRequestRateLimiter {

    private static final int MAX_REQUESTS_PER_MINUTE = 5;
    private static final int MAX_REQUESTS_PER_DAY = 20;
    private static final Duration MINUTE_WINDOW = Duration.ofMinutes(1);
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final Clock clock;
    private final Deque<Instant> minuteRequests = new ArrayDeque<>();
    private LocalDate currentDate;
    private int dailyRequests;

    GeminiRequestRateLimiter(Clock clock) {
        this.clock = clock;
        this.currentDate = LocalDate.ofInstant(clock.instant(), SEOUL);
    }

    synchronized void acquire() {
        acquire("UNKNOWN");
    }

    synchronized void acquire(String stage) {
        Instant now = clock.instant();
        LocalDate requestDate = LocalDate.ofInstant(now, SEOUL);
        if (!requestDate.equals(currentDate)) {
            currentDate = requestDate;
            dailyRequests = 0;
        }

        Instant windowStart = now.minus(MINUTE_WINDOW);
        while (!minuteRequests.isEmpty() && !minuteRequests.getFirst().isAfter(windowStart)) {
            minuteRequests.removeFirst();
        }

        if (dailyRequests >= MAX_REQUESTS_PER_DAY) {
            throw new IllegalStateException(
                    "Gemini daily request limit exceeded: stage=" + stage
                            + ", dailyUsed=" + dailyRequests + "/" + MAX_REQUESTS_PER_DAY
            );
        }
        if (minuteRequests.size() >= MAX_REQUESTS_PER_MINUTE) {
            long retryAfterSeconds = Math.max(
                    1,
                    Duration.between(now, minuteRequests.getFirst().plus(MINUTE_WINDOW)).toSeconds()
            );
            throw new IllegalStateException(
                    "Gemini minute request limit exceeded: stage=" + stage
                            + ", minuteUsed=" + minuteRequests.size() + "/" + MAX_REQUESTS_PER_MINUTE
                            + ", dailyUsed=" + dailyRequests + "/" + MAX_REQUESTS_PER_DAY
                            + ", nextRequest=" + (dailyRequests + 1)
                            + ", retryAfterSeconds=" + retryAfterSeconds
            );
        }

        minuteRequests.addLast(now);
        dailyRequests++;
    }
}
