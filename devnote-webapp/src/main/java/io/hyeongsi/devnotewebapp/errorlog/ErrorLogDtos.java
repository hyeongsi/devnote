package io.hyeongsi.devnotewebapp.errorlog;

import java.time.LocalDateTime;

public final class ErrorLogDtos {

    private ErrorLogDtos() {
    }

    public record SummaryResponse(
            Long id,
            LocalDateTime occurredAt,
            String method,
            String path,
            Integer status,
            String exceptionType,
            String message,
            Long durationMs
    ) {
    }

    public record DetailResponse(
            Long id,
            LocalDateTime occurredAt,
            String method,
            String path,
            String queryString,
            Integer status,
            String exceptionType,
            String message,
            String stackTrace,
            Long durationMs,
            String clientIp,
            String userAgent
    ) {
    }

    public record ErrorResponse(String message) {
    }
}
