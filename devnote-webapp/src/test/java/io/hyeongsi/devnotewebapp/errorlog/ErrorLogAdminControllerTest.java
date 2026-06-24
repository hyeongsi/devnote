package io.hyeongsi.devnotewebapp.errorlog;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ErrorLogAdminControllerTest {

    private final ErrorLogAdminService service = mock(ErrorLogAdminService.class);
    private final MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new ErrorLogAdminController(service)).build();

    @Test
    void listsErrorLogSummaries() throws Exception {
        when(service.summaries()).thenReturn(List.of(new ErrorLogDtos.SummaryResponse(
                1L,
                LocalDateTime.parse("2026-06-24T10:15:30"),
                "GET",
                "/api/posts",
                503,
                "IllegalStateException",
                "database down",
                31L
        )));

        mockMvc.perform(get("/api/admin/error-logs").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].method").value("GET"))
                .andExpect(jsonPath("$[0].path").value("/api/posts"))
                .andExpect(jsonPath("$[0].status").value(503));
    }

    @Test
    void getsErrorLogDetail() throws Exception {
        when(service.detail(1L)).thenReturn(new ErrorLogDtos.DetailResponse(
                1L,
                LocalDateTime.parse("2026-06-24T10:15:30"),
                "POST",
                "/api/admin/ai-posting/run",
                null,
                500,
                "RuntimeException",
                "boom",
                "java.lang.RuntimeException: boom",
                44L,
                "127.0.0.1",
                "JUnit"
        ));

        mockMvc.perform(get("/api/admin/error-logs/1").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.path").value("/api/admin/ai-posting/run"))
                .andExpect(jsonPath("$.stackTrace").value("java.lang.RuntimeException: boom"));
    }
}
