package io.hyeongsi.devnotewebapp.dashboard;

import com.querydsl.core.Tuple;
import com.querydsl.core.types.dsl.DateExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

import static io.hyeongsi.devnotewebapp.comment.QComment.comment;
import static io.hyeongsi.devnotewebapp.like.QPostLike.postLike;
import static io.hyeongsi.devnotewebapp.post.QPost.post;
import static io.hyeongsi.devnotewebapp.subscriber.QSubscriber.subscriber;
import static io.hyeongsi.devnotewebapp.view.QPostView.postView;

@Repository
public class DashboardQueryRepositoryImpl implements DashboardQueryRepository {

    private final JPAQueryFactory queryFactory;

    public DashboardQueryRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public DashboardStatsResponse fetchStats(LocalDateTime subscriberCutoff) {
        return new DashboardStatsResponse(
                value(queryFactory.select(post.count()).from(post).fetchOne()),
                value(queryFactory.select(post.viewCount.sum().longValue()).from(post).fetchOne()),
                value(queryFactory.select(postLike.count()).from(postLike).fetchOne()),
                value(queryFactory.select(comment.count()).from(comment).fetchOne()),
                value(queryFactory.select(subscriber.count())
                        .from(subscriber)
                        .where(subscriber.subscribedAt.goe(subscriberCutoff))
                        .fetchOne())
        );
    }

    @Override
    public List<DashboardTrafficResponse> fetchTraffic(LocalDateTime start, LocalDateTime end) {
        DateExpression<LocalDate> viewedDate =
                Expressions.dateTemplate(LocalDate.class, "date({0})", postView.viewedAt);

        return queryFactory
                .select(viewedDate, postView.count())
                .from(postView)
                .where(postView.viewedAt.goe(start), postView.viewedAt.lt(end))
                .groupBy(viewedDate)
                .orderBy(viewedDate.asc())
                .fetch()
                .stream()
                .map(tuple -> toTraffic(tuple, viewedDate))
                .toList();
    }

    @Override
    public List<DashboardActivityResponse> fetchRecentActivities(int limit) {
        Stream<DashboardActivityResponse> posts = queryFactory
                .selectFrom(post)
                .orderBy(post.publishedAt.desc(), post.id.desc())
                .limit(limit)
                .fetch()
                .stream()
                .map(item -> new DashboardActivityResponse(
                        "POST_CREATED",
                        "post-" + item.getId(),
                        item.getTitle(),
                        item.getPublishedAt().atTime(LocalTime.MIN)
                ));
        Stream<DashboardActivityResponse> comments = queryFactory
                .selectFrom(comment)
                .join(comment.post, post).fetchJoin()
                .orderBy(comment.createdAt.desc(), comment.id.desc())
                .limit(limit)
                .fetch()
                .stream()
                .map(item -> new DashboardActivityResponse(
                        "COMMENT_CREATED",
                        "comment-" + item.getId(),
                        item.getPostTitle(),
                        item.getCreatedAt()
                ));
        Stream<DashboardActivityResponse> likes = queryFactory
                .selectFrom(postLike)
                .join(postLike.post, post).fetchJoin()
                .orderBy(postLike.createdAt.desc(), postLike.id.desc())
                .limit(limit)
                .fetch()
                .stream()
                .map(item -> new DashboardActivityResponse(
                        "POST_LIKED",
                        "like-" + item.getId(),
                        item.getPostTitle(),
                        item.getCreatedAt()
                ));
        Stream<DashboardActivityResponse> subscribers = queryFactory
                .selectFrom(subscriber)
                .orderBy(subscriber.subscribedAt.desc(), subscriber.id.desc())
                .limit(limit)
                .fetch()
                .stream()
                .map(item -> new DashboardActivityResponse(
                        "SUBSCRIBER_CREATED",
                        "subscriber-" + item.getId(),
                        item.getEmail(),
                        item.getSubscribedAt()
                ));

        return Stream.of(posts, comments, likes, subscribers)
                .flatMap(stream -> stream)
                .sorted(Comparator.comparing(DashboardActivityResponse::occurredAt).reversed())
                .limit(limit)
                .toList();
    }

    private DashboardTrafficResponse toTraffic(
            Tuple tuple,
            DateExpression<LocalDate> viewedDate
    ) {
        return new DashboardTrafficResponse(
                tuple.get(viewedDate),
                value(tuple.get(postView.count()))
        );
    }

    private long value(Long value) {
        return value == null ? 0L : value;
    }
}
