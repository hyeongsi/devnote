package io.hyeongsi.devnotewebapp.post;

import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static io.hyeongsi.devnotewebapp.post.QPost.post;

@Repository
public class PostRepositoryImpl implements PostRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    public PostRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public List<Post> findPostList() {
        return queryFactory
                .selectFrom(post)
                .orderBy(post.publishedAt.desc(), post.id.desc())
                .fetch();
    }

    @Override
    public Optional<Post> findPostDetail(String categorySlug, String postSlug) {
        return Optional.ofNullable(
                queryFactory
                        .selectFrom(post)
                        .where(
                                post.categorySlug.eq(categorySlug),
                                post.slug.eq(postSlug)
                        )
                        .fetchOne()
        );
    }
}
