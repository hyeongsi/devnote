package io.hyeongsi.devnotewebapp.dashboard;

import io.hyeongsi.devnotewebapp.comment.CommentRepository;
import io.hyeongsi.devnotewebapp.like.PostLikeRepository;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import io.hyeongsi.devnotewebapp.subscriber.SubscriberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final int NEW_SUBSCRIBER_PERIOD_DAYS = 7;

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final SubscriberRepository subscriberRepository;
    private final Clock clock;

    public DashboardService(
            PostRepository postRepository,
            PostLikeRepository postLikeRepository,
            CommentRepository commentRepository,
            SubscriberRepository subscriberRepository,
            Clock clock
    ) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.commentRepository = commentRepository;
        this.subscriberRepository = subscriberRepository;
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
}
