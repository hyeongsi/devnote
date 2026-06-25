package io.hyeongsi.devnotewebapp.errorlog;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ErrorLogAdminServiceTest {

    private final ErrorLogRepository repository = mock(ErrorLogRepository.class);
    private final ErrorLogAdminService service = new ErrorLogAdminService(repository);

    @Test
    void summariesReturnNewestErrorsFirst() {
        ErrorLog error = errorLog("GET", "/api/posts", 503, "IllegalStateException", "database down");
        when(repository.findAll(any(Specification.class), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(error)));

        List<ErrorLogDtos.SummaryResponse> summaries = service.summaries(
                "posts",
                503,
                "GET",
                LocalDate.parse("2026-06-01"),
                LocalDate.parse("2026-06-30")
        );

        assertThat(summaries).hasSize(1);
        assertThat(summaries.getFirst().method()).isEqualTo("GET");
        assertThat(summaries.getFirst().path()).isEqualTo("/api/posts");
        assertThat(summaries.getFirst().status()).isEqualTo(503);
        assertThat(summaries.getFirst().exceptionType()).isEqualTo("IllegalStateException");
        assertThat(summaries.getFirst().message()).isEqualTo("database down");
    }

    @Test
    void detailReturnsStackTrace() {
        ErrorLog error = errorLog("POST", "/api/admin/ai-posting/run", 500, "RuntimeException", "boom");
        when(repository.findById(7L)).thenReturn(Optional.of(error));

        ErrorLogDtos.DetailResponse detail = service.detail(7L);

        assertThat(detail.path()).isEqualTo("/api/admin/ai-posting/run");
        assertThat(detail.stackTrace()).contains("RuntimeException: boom");
    }

    @Test
    void detailRejectsUnknownErrorLogId() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.detail(404L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Error log not found");
    }

    private ErrorLog errorLog(String method, String path, int status, String exceptionType, String message) {
        return new ErrorLog(
                LocalDateTime.parse("2026-06-24T10:15:30"),
                method,
                path,
                "q=java",
                status,
                exceptionType,
                message,
                exceptionType + ": " + message + "\n\tat example.Stack.line(Stack.java:10)",
                23L,
                "127.0.0.1",
                "JUnit"
        );
    }
}
