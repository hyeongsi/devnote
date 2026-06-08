package io.hyeongsi.devnotewebapp.dashboard;

import io.hyeongsi.devnotewebapp.comment.CommentRepository;
import io.hyeongsi.devnotewebapp.like.PostLikeRepository;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import io.hyeongsi.devnotewebapp.subscriber.SubscriberRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardServiceTest {

    @Test
    void getStatsAggregatesPersistedDashboardData() {
        PostRepository postRepository = mock(PostRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        CommentRepository commentRepository = mock(CommentRepository.class);
        SubscriberRepository subscriberRepository = mock(SubscriberRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-08T00:00:00Z"), ZoneOffset.UTC);
        DashboardService dashboardService = new DashboardService(
                postRepository,
                postLikeRepository,
                commentRepository,
                subscriberRepository,
                clock
        );

        when(postRepository.count()).thenReturn(12L);
        when(postRepository.sumViewCount()).thenReturn(3456L);
        when(postLikeRepository.count()).thenReturn(87L);
        when(commentRepository.count()).thenReturn(23L);
        when(subscriberRepository.countBySubscribedAtGreaterThanEqual(
                LocalDateTime.of(2026, 6, 1, 0, 0)
        )).thenReturn(5L);

        DashboardStatsResponse response = dashboardService.getStats();

        assertThat(response).isEqualTo(new DashboardStatsResponse(12L, 3456L, 87L, 23L, 5L));
        verify(subscriberRepository).countBySubscribedAtGreaterThanEqual(
                LocalDateTime.of(2026, 6, 1, 0, 0)
        );
    }
}
