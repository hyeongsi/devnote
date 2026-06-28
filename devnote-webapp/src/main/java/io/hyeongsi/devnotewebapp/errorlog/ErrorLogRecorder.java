package io.hyeongsi.devnotewebapp.errorlog;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class ErrorLogRecorder {

    public static final String ERROR_LOG_RECORDED_ATTRIBUTE = ErrorLogRecorder.class.getName() + ".RECORDED";

    private final ErrorLogRepository repository;
    private final Clock clock;

    public ErrorLogRecorder(ErrorLogRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordException(HttpServletRequest request, int status, Throwable exception, long durationMs) {
        if (status < 400 || isRecorded(request)) {
            return;
        }
        repository.save(new ErrorLog(
                LocalDateTime.now(clock),
                request.getMethod(),
                request.getRequestURI(),
                request.getQueryString(),
                status,
                exception.getClass().getName(),
                exception.getMessage(),
                stackTrace(exception),
                durationMs,
                clientIp(request),
                request.getHeader("User-Agent")
        ));
        markRecorded(request);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordResponse(HttpServletRequest request, HttpServletResponse response, long durationMs) {
        if (response.getStatus() < 400 || isRecorded(request)) {
            return;
        }
        repository.save(new ErrorLog(
                LocalDateTime.now(clock),
                request.getMethod(),
                request.getRequestURI(),
                request.getQueryString(),
                response.getStatus(),
                null,
                null,
                null,
                durationMs,
                clientIp(request),
                request.getHeader("User-Agent")
        ));
        markRecorded(request);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSystemError(String method, String path, int status, Throwable exception, long durationMs) {
        if (status < 400) {
            return;
        }
        repository.save(new ErrorLog(
                LocalDateTime.now(clock),
                method,
                path,
                null,
                status,
                exception.getClass().getName(),
                exception.getMessage(),
                stackTrace(exception),
                durationMs,
                null,
                null
        ));
    }

    public boolean isRecorded(HttpServletRequest request) {
        return Boolean.TRUE.equals(request.getAttribute(ERROR_LOG_RECORDED_ATTRIBUTE));
    }

    public void markRecorded(HttpServletRequest request) {
        request.setAttribute(ERROR_LOG_RECORDED_ATTRIBUTE, Boolean.TRUE);
    }

    private String stackTrace(Throwable exception) {
        StringWriter writer = new StringWriter();
        exception.printStackTrace(new PrintWriter(writer));
        return writer.toString();
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
