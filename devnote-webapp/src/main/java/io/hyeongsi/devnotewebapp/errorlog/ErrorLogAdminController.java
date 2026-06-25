package io.hyeongsi.devnotewebapp.errorlog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/error-logs")
public class ErrorLogAdminController {

    private final ErrorLogAdminService service;

    public ErrorLogAdminController(ErrorLogAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<ErrorLogDtos.SummaryResponse> summaries(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String method,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return service.summaries(keyword, status, method, from, to);
    }

    @GetMapping("/{id}")
    public ErrorLogDtos.DetailResponse detail(@PathVariable Long id) {
        return service.detail(id);
    }
}
