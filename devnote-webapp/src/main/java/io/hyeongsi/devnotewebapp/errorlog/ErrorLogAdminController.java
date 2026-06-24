package io.hyeongsi.devnotewebapp.errorlog;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/error-logs")
public class ErrorLogAdminController {

    private final ErrorLogAdminService service;

    public ErrorLogAdminController(ErrorLogAdminService service) {
        this.service = service;
    }

    @GetMapping
    public List<ErrorLogDtos.SummaryResponse> summaries() {
        return service.summaries();
    }

    @GetMapping("/{id}")
    public ErrorLogDtos.DetailResponse detail(@PathVariable Long id) {
        return service.detail(id);
    }
}
