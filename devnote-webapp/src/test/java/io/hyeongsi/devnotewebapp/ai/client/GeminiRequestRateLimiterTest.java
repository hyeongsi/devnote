package io.hyeongsi.devnotewebapp.ai.client;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class GeminiRequestRateLimiterTest {

    @Test
    void rejectsTheSixthRequestInsideARollingMinute() {
        MutableClock clock = new MutableClock(Instant.parse("2026-06-22T00:00:00Z"));
        GeminiRequestRateLimiter limiter = new GeminiRequestRateLimiter(clock);

        for (int request = 1; request <= 5; request++) {
            assertThatCode(limiter::acquire).doesNotThrowAnyException();
        }

        assertThatThrownBy(() -> limiter.acquire("POST_REVIEW"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("minute")
                .hasMessageContaining("stage=POST_REVIEW")
                .hasMessageContaining("minuteUsed=5/5")
                .hasMessageContaining("dailyUsed=5/20")
                .hasMessageContaining("retryAfterSeconds=");
    }

    @Test
    void admitsARequestWhenTheOldestMinuteEntryExpires() {
        MutableClock clock = new MutableClock(Instant.parse("2026-06-22T00:00:00Z"));
        GeminiRequestRateLimiter limiter = new GeminiRequestRateLimiter(clock);
        for (int request = 1; request <= 5; request++) {
            limiter.acquire();
        }

        clock.advance(Duration.ofSeconds(60));

        assertThatCode(limiter::acquire).doesNotThrowAnyException();
    }

    @Test
    void rejectsTheTwentyFirstRequestUntilTheNextSeoulDay() {
        MutableClock clock = new MutableClock(Instant.parse("2026-06-22T00:00:00Z"));
        GeminiRequestRateLimiter limiter = new GeminiRequestRateLimiter(clock);
        for (int request = 1; request <= 20; request++) {
            limiter.acquire();
            if (request % 5 == 0) {
                clock.advance(Duration.ofSeconds(60));
            }
        }

        assertThatThrownBy(limiter::acquire)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("daily")
                .hasMessageContaining("20/20");

        clock.setInstant(Instant.parse("2026-06-22T15:00:00Z"));

        assertThatCode(limiter::acquire).doesNotThrowAnyException();
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        private void setInstant(Instant instant) {
            this.instant = instant;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
