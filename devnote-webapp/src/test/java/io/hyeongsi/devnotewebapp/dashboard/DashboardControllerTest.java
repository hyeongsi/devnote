package io.hyeongsi.devnotewebapp.dashboard;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class DashboardControllerTest {

    @Test
    void getStatsReturnsDashboardStatistics() throws Exception {
        DashboardService dashboardService = mock(DashboardService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new DashboardController(dashboardService)).build();

        when(dashboardService.getStats()).thenReturn(new DashboardStatsResponse(
                12L,
                3456L,
                87L,
                23L,
                5L
        ));

        mockMvc.perform(get("/api/admin/dashboard/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPosts").value(12))
                .andExpect(jsonPath("$.totalViews").value(3456))
                .andExpect(jsonPath("$.totalLikes").value(87))
                .andExpect(jsonPath("$.totalComments").value(23))
                .andExpect(jsonPath("$.newSubscribers").value(5));
    }

    @Test
    void getTrafficReturnsDailyViewCounts() throws Exception {
        DashboardService dashboardService = mock(DashboardService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new DashboardController(dashboardService)).build();

        when(dashboardService.getTraffic()).thenReturn(List.of(
                new DashboardTrafficResponse(LocalDate.of(2026, 6, 7), 3L),
                new DashboardTrafficResponse(LocalDate.of(2026, 6, 8), 5L)
        ));

        mockMvc.perform(get("/api/admin/dashboard/traffic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].date").value("2026-06-07"))
                .andExpect(jsonPath("$[0].value").value(3))
                .andExpect(jsonPath("$[1].value").value(5));
    }

    @Test
    void getRecentActivitiesReturnsPersistedActivities() throws Exception {
        DashboardService dashboardService = mock(DashboardService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new DashboardController(dashboardService)).build();

        when(dashboardService.getRecentActivities()).thenReturn(List.of(
                new DashboardActivityResponse(
                        "COMMENT_CREATED",
                        "comment-1",
                        "Commented post",
                        LocalDateTime.of(2026, 6, 8, 11, 0)
                )
        ));

        mockMvc.perform(get("/api/admin/dashboard/activities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("COMMENT_CREATED"))
                .andExpect(jsonPath("$[0].id").value("comment-1"))
                .andExpect(jsonPath("$[0].description").value("Commented post"))
                .andExpect(jsonPath("$[0].occurredAt").value("2026-06-08T11:00:00"));
    }
}
