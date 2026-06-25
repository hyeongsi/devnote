package io.hyeongsi.devnotewebapp.errorlog;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ErrorLogAdminService {

    private static final int DEFAULT_LIMIT = 50;

    private final ErrorLogRepository repository;

    public ErrorLogAdminService(ErrorLogRepository repository) {
        this.repository = repository;
    }

    public List<ErrorLogDtos.SummaryResponse> summaries(
            String keyword,
            Integer status,
            String method,
            LocalDate from,
            LocalDate to
    ) {
        return repository.findAll(specification(keyword, status, method, from, to), PageRequest.of(
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

    private Specification<ErrorLog> specification(
            String keyword,
            Integer status,
            String method,
            LocalDate from,
            LocalDate to
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String normalizedKeyword = "%" + keyword.trim().toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("path")), normalizedKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("message"), "")), normalizedKeyword),
                        criteriaBuilder.like(criteriaBuilder.lower(criteriaBuilder.coalesce(root.get("exceptionType"), "")), normalizedKeyword)
                ));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (method != null && !method.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("method"), method.trim().toUpperCase()));
            }

            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("occurredAt"), from.atStartOfDay()));
            }

            if (to != null) {
                predicates.add(criteriaBuilder.lessThan(root.get("occurredAt"), to.plusDays(1).atStartOfDay()));
            }

            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
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
