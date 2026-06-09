package io.hyeongsi.devnotewebapp.dashboard;

import java.time.LocalDateTime;

public record DashboardActivityResponse(
        String type,
        String id,
        String description,
        LocalDateTime occurredAt
) {
}
