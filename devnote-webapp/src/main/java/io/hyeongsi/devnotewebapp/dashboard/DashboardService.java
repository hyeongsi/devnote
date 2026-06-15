package io.hyeongsi.devnotewebapp.dashboard;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int NEW_SUBSCRIBER_PERIOD_DAYS = 7;

    private final DashboardQueryRepository queryRepository;
    private final Clock clock;

    public DashboardService(DashboardQueryRepository queryRepository, Clock clock) {
        this.queryRepository = queryRepository;
        this.clock = clock;
    }

    public DashboardStatsResponse getStats() {
        LocalDateTime subscriberCutoff = LocalDateTime.now(clock)
                .minusDays(NEW_SUBSCRIBER_PERIOD_DAYS);

        return queryRepository.fetchStats(subscriberCutoff);
    }

    public List<DashboardTrafficResponse> getTraffic() {
        LocalDate endDate = LocalDate.now(clock);
        LocalDate startDate = endDate.minusDays(6);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();
        Map<LocalDate, Long> viewsByDate = queryRepository
                .fetchTraffic(start, end)
                .stream()
                .collect(Collectors.toMap(
                        DashboardTrafficResponse::date,
                        DashboardTrafficResponse::value
                ));

        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> new DashboardTrafficResponse(date, viewsByDate.getOrDefault(date, 0L)))
                .toList();
    }

    public List<DashboardActivityResponse> getRecentActivities() {
        return queryRepository.fetchRecentActivities(5);
    }
}
