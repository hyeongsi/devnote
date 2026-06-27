package io.hyeongsi.devnotewebapp.errorlog;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ErrorLogRecorderTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-06-26T05:39:00Z"),
            ZoneId.of("Asia/Seoul")
    );

    @Test
    void recordsSystemErrorForBackgroundFailures() {
        ErrorLogRepository repository = mock(ErrorLogRepository.class);
        when(repository.save(any(ErrorLog.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ErrorLogRecorder recorder = new ErrorLogRecorder(repository, CLOCK);
        IllegalStateException exception = new IllegalStateException(
                "Gemini generation stopped because finishReason=MAX_TOKENS"
        );

        recorder.recordSystemError(
                "SCHEDULED",
                "/internal/ai-auto-posting/scheduled",
                500,
                exception,
                742L
        );

        ArgumentCaptor<ErrorLog> errorLogCaptor = ArgumentCaptor.forClass(ErrorLog.class);
        verify(repository).save(errorLogCaptor.capture());

        ErrorLog saved = errorLogCaptor.getValue();
        assertThat(saved.getOccurredAt()).isEqualTo(java.time.LocalDateTime.of(2026, 6, 26, 14, 39));
        assertThat(saved.getMethod()).isEqualTo("SCHEDULED");
        assertThat(saved.getPath()).isEqualTo("/internal/ai-auto-posting/scheduled");
        assertThat(saved.getStatus()).isEqualTo(500);
        assertThat(saved.getExceptionType()).isEqualTo(IllegalStateException.class.getName());
        assertThat(saved.getMessage()).isEqualTo("Gemini generation stopped because finishReason=MAX_TOKENS");
        assertThat(saved.getStackTrace()).contains("IllegalStateException");
        assertThat(saved.getDurationMs()).isEqualTo(742L);
        assertThat(saved.getClientIp()).isNull();
        assertThat(saved.getUserAgent()).isNull();
    }
}
