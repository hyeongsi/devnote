package io.hyeongsi.devnotewebapp.dashboard;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    @Test
    void getStatsAggregatesPersistedDashboardData() {
        DashboardQueryRepository queryRepository = mock(DashboardQueryRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-08T00:00:00Z"), ZoneOffset.UTC);
        DashboardService dashboardService = new DashboardService(queryRepository, clock);

        when(queryRepository.fetchStats(java.time.LocalDateTime.of(2026, 6, 1, 0, 0)))
                .thenReturn(new DashboardStatsResponse(12L, 3456L, 87L, 23L, 5L));

        DashboardStatsResponse response = dashboardService.getStats();

        assertThat(response).isEqualTo(new DashboardStatsResponse(12L, 3456L, 87L, 23L, 5L));
    }

    @Test
    void getTrafficReturnsLastSevenDaysIncludingDatesWithoutViews() {
        DashboardQueryRepository queryRepository = mock(DashboardQueryRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-08T12:00:00Z"), ZoneOffset.UTC);
        DashboardService dashboardService = new DashboardService(queryRepository, clock);

        when(queryRepository.fetchTraffic(
                java.time.LocalDateTime.of(2026, 6, 2, 0, 0),
                java.time.LocalDateTime.of(2026, 6, 9, 0, 0)
        )).thenReturn(List.of(
                new DashboardTrafficResponse(LocalDate.of(2026, 6, 2), 1L),
                new DashboardTrafficResponse(LocalDate.of(2026, 6, 8), 2L)
        ));

        List<DashboardTrafficResponse> traffic = dashboardService.getTraffic();

        assertThat(traffic)
                .extracting(DashboardTrafficResponse::date)
                .containsExactly(
                        LocalDate.of(2026, 6, 2),
                        LocalDate.of(2026, 6, 3),
                        LocalDate.of(2026, 6, 4),
                        LocalDate.of(2026, 6, 5),
                        LocalDate.of(2026, 6, 6),
                        LocalDate.of(2026, 6, 7),
                        LocalDate.of(2026, 6, 8)
                );
        assertThat(traffic)
                .extracting(DashboardTrafficResponse::value)
                .containsExactly(1L, 0L, 0L, 0L, 0L, 0L, 2L);
    }

    @Test
    void getRecentActivitiesMergesPersistedEventsInLatestOrder() {
        DashboardQueryRepository queryRepository = mock(DashboardQueryRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-08T12:00:00Z"), ZoneOffset.UTC);
        DashboardService dashboardService = new DashboardService(queryRepository, clock);
        when(queryRepository.fetchRecentActivities(5)).thenReturn(List.of(
                new DashboardActivityResponse("COMMENT_CREATED", "comment-2", "Commented post",
                        java.time.LocalDateTime.of(2026, 6, 8, 11, 0)),
                new DashboardActivityResponse("POST_LIKED", "like-3", "Liked post",
                        java.time.LocalDateTime.of(2026, 6, 8, 10, 0)),
                new DashboardActivityResponse("SUBSCRIBER_CREATED", "subscriber-4", "reader@example.com",
                        java.time.LocalDateTime.of(2026, 6, 8, 9, 0)),
                new DashboardActivityResponse("POST_CREATED", "post-1", "New post",
                        java.time.LocalDateTime.of(2026, 6, 8, 0, 0))
        ));

        List<DashboardActivityResponse> activities = dashboardService.getRecentActivities();

        assertThat(activities)
                .extracting(DashboardActivityResponse::type)
                .containsExactly("COMMENT_CREATED", "POST_LIKED", "SUBSCRIBER_CREATED", "POST_CREATED");
        assertThat(activities)
                .extracting(DashboardActivityResponse::description)
                .containsExactly("Commented post", "Liked post", "reader@example.com", "New post");
    }
}
