package io.hyeongsi.devnotewebapp.dashboard;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

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
}
