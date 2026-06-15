package io.hyeongsi.devnotewebapp.dashboard;

import java.time.LocalDateTime;
import java.util.List;

public interface DashboardQueryRepository {

    DashboardStatsResponse fetchStats(LocalDateTime subscriberCutoff);

    List<DashboardTrafficResponse> fetchTraffic(LocalDateTime start, LocalDateTime end);

    List<DashboardActivityResponse> fetchRecentActivities(int limit);
}
