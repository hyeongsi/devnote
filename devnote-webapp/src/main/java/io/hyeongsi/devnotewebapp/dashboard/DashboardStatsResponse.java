package io.hyeongsi.devnotewebapp.dashboard;

public record DashboardStatsResponse(
        long totalPosts,
        long totalViews,
        long totalLikes,
        long totalComments,
        long newSubscribers
) {
}
