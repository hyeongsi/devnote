package io.hyeongsi.devnotewebapp.dashboard;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public DashboardStatsResponse getStats() {
        return dashboardService.getStats();
    }

    @GetMapping("/traffic")
    public List<DashboardTrafficResponse> getTraffic() {
        return dashboardService.getTraffic();
    }

    @GetMapping("/activities")
    public List<DashboardActivityResponse> getRecentActivities() {
        return dashboardService.getRecentActivities();
    }
}
