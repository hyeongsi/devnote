package io.hyeongsi.devnotewebapp.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import io.hyeongsi.devnotewebapp.errorlog.ErrorLogRecorder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestErrorLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RequestErrorLoggingFilter.class);

    private final ErrorLogRecorder errorLogRecorder;

    public RequestErrorLoggingFilter(ErrorLogRecorder errorLogRecorder) {
        this.errorLogRecorder = errorLogRecorder;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } catch (ServletException | IOException | RuntimeException exception) {
            long durationMs = elapsedMillis(startedAt);
            int status = response.getStatus() >= 500 ? response.getStatus() : 500;
            log.error(
                    "request failed method={} path={} status={} errorType={} durationMs={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    status,
                    exception.getClass().getSimpleName(),
                    durationMs
            );
            if (!errorLogRecorder.isRecorded(request)) {
                errorLogRecorder.recordException(request, status, exception, durationMs);
            }
            throw exception;
        }
        if (response.getStatus() >= 500) {
            long durationMs = elapsedMillis(startedAt);
            log.error(
                "request failed method={} path={} status={} durationMs={}",
                request.getMethod(),
                request.getRequestURI(),
                response.getStatus(),
                durationMs
            );
            if (!errorLogRecorder.isRecorded(request)) {
                errorLogRecorder.recordResponse(request, response, durationMs);
            }
        }
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000L;
    }
}
