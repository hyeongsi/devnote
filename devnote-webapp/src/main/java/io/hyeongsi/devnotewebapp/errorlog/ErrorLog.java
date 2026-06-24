package io.hyeongsi.devnotewebapp.errorlog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "error_logs")
public class ErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime occurredAt;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(nullable = false, length = 1000)
    private String path;

    @Column(length = 2000)
    private String queryString;

    @Column(nullable = false)
    private Integer status;

    @Column(length = 300)
    private String exceptionType;

    @Column(length = 2000)
    private String message;

    @Lob
    @Column(columnDefinition = "MEDIUMTEXT")
    private String stackTrace;

    @Column(nullable = false)
    private Long durationMs;

    @Column(length = 100)
    private String clientIp;

    @Column(length = 1000)
    private String userAgent;

    protected ErrorLog() {
    }

    public ErrorLog(
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
        this.occurredAt = occurredAt;
        this.method = method;
        this.path = path;
        this.queryString = queryString;
        this.status = status;
        this.exceptionType = exceptionType;
        this.message = message;
        this.stackTrace = stackTrace;
        this.durationMs = durationMs;
        this.clientIp = clientIp;
        this.userAgent = userAgent;
    }

    public Long getId() { return id; }

    public LocalDateTime getOccurredAt() { return occurredAt; }

    public String getMethod() { return method; }

    public String getPath() { return path; }

    public String getQueryString() { return queryString; }

    public Integer getStatus() { return status; }

    public String getExceptionType() { return exceptionType; }

    public String getMessage() { return message; }

    public String getStackTrace() { return stackTrace; }

    public Long getDurationMs() { return durationMs; }

    public String getClientIp() { return clientIp; }

    public String getUserAgent() { return userAgent; }
}
