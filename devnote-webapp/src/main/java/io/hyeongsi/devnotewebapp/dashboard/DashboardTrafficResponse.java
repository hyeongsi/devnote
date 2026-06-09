package io.hyeongsi.devnotewebapp.dashboard;

import java.time.LocalDate;

public record DashboardTrafficResponse(
        LocalDate date,
        long value
) {
}
