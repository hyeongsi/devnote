package io.hyeongsi.devnotewebapp.dashboard;

import io.hyeongsi.devnotewebapp.comment.CommentRepository;
import io.hyeongsi.devnotewebapp.like.PostLikeRepository;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import io.hyeongsi.devnotewebapp.subscriber.SubscriberRepository;
import io.hyeongsi.devnotewebapp.view.PostViewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int NEW_SUBSCRIBER_PERIOD_DAYS = 7;

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final SubscriberRepository subscriberRepository;
    private final PostViewRepository postViewRepository;
    private final Clock clock;

    public DashboardService(
            PostRepository postRepository,
            PostLikeRepository postLikeRepository,
            CommentRepository commentRepository,
            SubscriberRepository subscriberRepository,
            PostViewRepository postViewRepository,
            Clock clock
    ) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
        this.subscriberRepository = subscriberRepository;
        this.postViewRepository = postViewRepository;
        this.clock = clock;
    }

    public DashboardStatsResponse getStats() {
        LocalDateTime subscriberCutoff = LocalDateTime.now(clock)
                .minusDays(NEW_SUBSCRIBER_PERIOD_DAYS);

        return new DashboardStatsResponse(
                postRepository.count(),
                postRepository.sumViewCount(),
                postLikeRepository.count(),
                commentRepository.count(),
                subscriberRepository.countBySubscribedAtGreaterThanEqual(subscriberCutoff)
        );
    }

    public List<DashboardTrafficResponse> getTraffic() {
        LocalDate endDate = LocalDate.now(clock);
        LocalDate startDate = endDate.minusDays(6);
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();
        Map<LocalDate, Long> viewsByDate = postViewRepository
                .findAllByViewedAtGreaterThanEqualAndViewedAtLessThan(start, end)
                .stream()
                .collect(Collectors.groupingBy(
                        view -> view.getViewedAt().toLocalDate(),
                        Collectors.counting()
                ));

        return startDate.datesUntil(endDate.plusDays(1))
                .map(date -> new DashboardTrafficResponse(date, viewsByDate.getOrDefault(date, 0L)))
                .toList();
    }

    public List<DashboardActivityResponse> getRecentActivities() {
        Stream<DashboardActivityResponse> posts = postRepository
                .findTop5ByOrderByPublishedAtDescIdDesc()
                .stream()
                .map(post -> new DashboardActivityResponse(
                        "POST_CREATED",
                        "post-" + post.getId(),
                        post.getTitle(),
                        post.getPublishedAt().atTime(LocalTime.MIN)
                ));
        Stream<DashboardActivityResponse> comments = commentRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(comment -> new DashboardActivityResponse(
                        "COMMENT_CREATED",
                        "comment-" + comment.getId(),
                        comment.getPostTitle(),
                        comment.getCreatedAt()
                ));
        Stream<DashboardActivityResponse> likes = postLikeRepository
                .findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(like -> new DashboardActivityResponse(
                        "POST_LIKED",
                        "like-" + like.getId(),
                        like.getPostTitle(),
                        like.getCreatedAt()
                ));
        Stream<DashboardActivityResponse> subscribers = subscriberRepository
                .findTop5ByOrderBySubscribedAtDesc()
                .stream()
                .map(subscriber -> new DashboardActivityResponse(
                        "SUBSCRIBER_CREATED",
                        "subscriber-" + subscriber.getId(),
                        subscriber.getEmail(),
                        subscriber.getSubscribedAt()
                ));

        return Stream.of(posts, comments, likes, subscribers)
                .flatMap(stream -> stream)
                .sorted(Comparator.comparing(DashboardActivityResponse::occurredAt).reversed())
                .limit(5)
                .toList();
    }
}
