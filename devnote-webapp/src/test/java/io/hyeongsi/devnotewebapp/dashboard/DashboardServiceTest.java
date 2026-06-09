package io.hyeongsi.devnotewebapp.dashboard;

import io.hyeongsi.devnotewebapp.comment.CommentRepository;
import io.hyeongsi.devnotewebapp.comment.Comment;
import io.hyeongsi.devnotewebapp.like.PostLikeRepository;
import io.hyeongsi.devnotewebapp.like.PostLike;
import io.hyeongsi.devnotewebapp.post.Post;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import io.hyeongsi.devnotewebapp.subscriber.SubscriberRepository;
import io.hyeongsi.devnotewebapp.subscriber.Subscriber;
import io.hyeongsi.devnotewebapp.view.PostView;
import io.hyeongsi.devnotewebapp.view.PostViewRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

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
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-08T00:00:00Z"), ZoneOffset.UTC);
        DashboardService dashboardService = new DashboardService(
                postRepository,
                postLikeRepository,
                commentRepository,
                subscriberRepository,
                postViewRepository,
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

    @Test
    void getTrafficReturnsLastSevenDaysIncludingDatesWithoutViews() {
        PostRepository postRepository = mock(PostRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        CommentRepository commentRepository = mock(CommentRepository.class);
        SubscriberRepository subscriberRepository = mock(SubscriberRepository.class);
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-08T12:00:00Z"), ZoneOffset.UTC);
        DashboardService dashboardService = new DashboardService(
                postRepository,
                postLikeRepository,
                commentRepository,
                subscriberRepository,
                postViewRepository,
                clock
        );

        PostView juneSecondView = mock(PostView.class);
        PostView juneEighthViewOne = mock(PostView.class);
        PostView juneEighthViewTwo = mock(PostView.class);
        when(juneSecondView.getViewedAt()).thenReturn(LocalDateTime.of(2026, 6, 2, 10, 0));
        when(juneEighthViewOne.getViewedAt()).thenReturn(LocalDateTime.of(2026, 6, 8, 9, 0));
        when(juneEighthViewTwo.getViewedAt()).thenReturn(LocalDateTime.of(2026, 6, 8, 11, 0));
        when(postViewRepository.findAllByViewedAtGreaterThanEqualAndViewedAtLessThan(
                LocalDateTime.of(2026, 6, 2, 0, 0),
                LocalDateTime.of(2026, 6, 9, 0, 0)
        )).thenReturn(List.of(juneSecondView, juneEighthViewOne, juneEighthViewTwo));

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
        PostRepository postRepository = mock(PostRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        CommentRepository commentRepository = mock(CommentRepository.class);
        SubscriberRepository subscriberRepository = mock(SubscriberRepository.class);
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-08T12:00:00Z"), ZoneOffset.UTC);
        DashboardService dashboardService = new DashboardService(
                postRepository,
                postLikeRepository,
                commentRepository,
                subscriberRepository,
                postViewRepository,
                clock
        );

        Post post = mock(Post.class);
        Comment comment = mock(Comment.class);
        PostLike postLike = mock(PostLike.class);
        Subscriber subscriber = mock(Subscriber.class);
        when(post.getId()).thenReturn(1L);
        when(post.getTitle()).thenReturn("New post");
        when(post.getPublishedAt()).thenReturn(LocalDate.of(2026, 6, 8));
        when(comment.getId()).thenReturn(2L);
        when(comment.getPostTitle()).thenReturn("Commented post");
        when(comment.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 6, 8, 11, 0));
        when(postLike.getId()).thenReturn(3L);
        when(postLike.getPostTitle()).thenReturn("Liked post");
        when(postLike.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 6, 8, 10, 0));
        when(subscriber.getId()).thenReturn(4L);
        when(subscriber.getEmail()).thenReturn("reader@example.com");
        when(subscriber.getSubscribedAt()).thenReturn(LocalDateTime.of(2026, 6, 8, 9, 0));
        when(postRepository.findTop5ByOrderByPublishedAtDescIdDesc()).thenReturn(List.of(post));
        when(commentRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of(comment));
        when(postLikeRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of(postLike));
        when(subscriberRepository.findTop5ByOrderBySubscribedAtDesc()).thenReturn(List.of(subscriber));

        List<DashboardActivityResponse> activities = dashboardService.getRecentActivities();

        assertThat(activities)
                .extracting(DashboardActivityResponse::type)
                .containsExactly("COMMENT_CREATED", "POST_LIKED", "SUBSCRIBER_CREATED", "POST_CREATED");
        assertThat(activities)
                .extracting(DashboardActivityResponse::description)
                .containsExactly("Commented post", "Liked post", "reader@example.com", "New post");
    }
}
