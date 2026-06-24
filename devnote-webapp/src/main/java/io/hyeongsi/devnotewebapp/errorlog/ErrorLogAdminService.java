package io.hyeongsi.devnotewebapp.errorlog;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ErrorLogAdminService {

    private static final int DEFAULT_LIMIT = 50;

    private final ErrorLogRepository repository;

    public ErrorLogAdminService(ErrorLogRepository repository) {
        this.repository = repository;
    }

    public List<ErrorLogDtos.SummaryResponse> summaries() {
        return repository.findAll(PageRequest.of(
                        0,
                        DEFAULT_LIMIT,
                        Sort.by(Sort.Direction.DESC, "occurredAt")
                ))
                .stream()
                .map(this::toSummary)
                .toList();
    }

    public ErrorLogDtos.DetailResponse detail(Long id) {
        return repository.findById(id)
                .map(this::toDetail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Error log not found"));
    }

    private ErrorLogDtos.SummaryResponse toSummary(ErrorLog errorLog) {
        return new ErrorLogDtos.SummaryResponse(
                errorLog.getId(),
                errorLog.getOccurredAt(),
                errorLog.getMethod(),
                errorLog.getPath(),
                errorLog.getStatus(),
                errorLog.getExceptionType(),
                errorLog.getMessage(),
                errorLog.getDurationMs()
        );
    }

    private ErrorLogDtos.DetailResponse toDetail(ErrorLog errorLog) {
        return new ErrorLogDtos.DetailResponse(
                errorLog.getId(),
                errorLog.getOccurredAt(),
                errorLog.getMethod(),
                errorLog.getPath(),
                errorLog.getQueryString(),
                errorLog.getStatus(),
                errorLog.getExceptionType(),
                errorLog.getMessage(),
                errorLog.getStackTrace(),
                errorLog.getDurationMs(),
                errorLog.getClientIp(),
                errorLog.getUserAgent()
        );
    }
}
