package io.hyeongsi.devnotewebapp.config;

import io.hyeongsi.devnotewebapp.ai.autopost.AiPostRunRepository;
import io.hyeongsi.devnotewebapp.ai.autopost.AiPostTopicRepository;
import io.hyeongsi.devnotewebapp.dashboard.DashboardQueryRepository;
import io.hyeongsi.devnotewebapp.dashboard.DashboardTrafficResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class QuerydslRepositoryIntegrationTest {

    @Autowired
    private DashboardQueryRepository dashboardQueryRepository;

    @Autowired
    private AiPostTopicRepository topicRepository;

    @Autowired
    private AiPostRunRepository runRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void dashboardTrafficIsGroupedByDateInTheDatabase() {
        jdbcTemplate.update(
                "delete from post_view_events where viewed_at >= ? and viewed_at < ?",
                Timestamp.valueOf("2026-06-10 00:00:00"),
                Timestamp.valueOf("2026-06-12 00:00:00")
        );
        insertView(LocalDateTime.of(2026, 6, 10, 9, 0));
        insertView(LocalDateTime.of(2026, 6, 10, 12, 0));
        insertView(LocalDateTime.of(2026, 6, 11, 8, 0));

        assertThat(dashboardQueryRepository.fetchTraffic(
                LocalDateTime.of(2026, 6, 10, 0, 0),
                LocalDateTime.of(2026, 6, 12, 0, 0)
        )).containsExactly(
                new DashboardTrafficResponse(LocalDate.of(2026, 6, 10), 2L),
                new DashboardTrafficResponse(LocalDate.of(2026, 6, 11), 1L)
        );
    }

    @Test
    void autoPostingQueriesApplyPredicatesOrderingAndLimits() {
        jdbcTemplate.update("""
                insert into ai_post_topics
                    (id, name, category_id, display_order, enabled, last_succeeded_at, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, ?)
                """, 101L, "Used topic", 1L, 1, true,
                Timestamp.valueOf("2026-06-14 06:00:00"),
                Timestamp.valueOf("2026-06-01 00:00:00"),
                Timestamp.valueOf("2026-06-14 06:00:00"));
        jdbcTemplate.update("""
                insert into ai_post_topics
                    (id, name, category_id, display_order, enabled, last_succeeded_at, created_at, updated_at)
                values (?, ?, ?, ?, ?, ?, ?, ?)
                """, 102L, "Unused topic", 1L, 2, true, null,
                Timestamp.valueOf("2026-06-01 00:00:00"),
                Timestamp.valueOf("2026-06-01 00:00:00"));
        jdbcTemplate.update("""
                insert into ai_post_runs
                    (id, topic_id, status, generated_title, started_at, completed_at)
                values (?, ?, ?, ?, ?, ?)
                """, 201L, 101L, "SUCCEEDED", "Generated title",
                Timestamp.valueOf("2026-06-15 06:00:00"),
                Timestamp.valueOf("2026-06-15 06:01:00"));

        assertThat(topicRepository.findNextEnabledTopic())
                .get()
                .extracting(topic -> topic.getName())
                .isEqualTo("Unused topic");
        assertThat(runRepository.existsSucceededBetween(
                LocalDateTime.of(2026, 6, 15, 0, 0),
                LocalDateTime.of(2026, 6, 16, 0, 0)
        )).isTrue();
        assertThat(runRepository.findRecentGeneratedTitles(
                topicRepository.findById(101L).orElseThrow(),
                io.hyeongsi.devnotewebapp.ai.autopost.AiPostRunStatus.SUCCEEDED,
                5
        )).containsExactly("Generated title");
    }

    private void insertView(LocalDateTime viewedAt) {
        jdbcTemplate.update(
                "insert into post_view_events (post_id, viewed_at) values (?, ?)",
                1L,
                Timestamp.valueOf(viewedAt)
        );
    }
}
