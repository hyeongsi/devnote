package io.hyeongsi.devnotewebapp.ai.autopost;

import com.querydsl.jpa.impl.JPAQueryFactory;

import java.util.List;
import java.util.Optional;

import static io.hyeongsi.devnotewebapp.ai.autopost.QAiPostTopic.aiPostTopic;
import static io.hyeongsi.devnotewebapp.category.QCategory.category;

public class AiPostTopicRepositoryImpl implements AiPostTopicRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    public AiPostTopicRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public Optional<AiPostTopic> findNextEnabledTopic() {
        return Optional.ofNullable(queryFactory
                .selectFrom(aiPostTopic)
                .join(aiPostTopic.category, category).fetchJoin()
                .where(aiPostTopic.enabled.isTrue())
                .orderBy(
                        aiPostTopic.lastSucceededAt.asc().nullsFirst(),
                        aiPostTopic.displayOrder.asc(),
                        aiPostTopic.id.asc()
                )
                .fetchFirst());
    }

    @Override
    public List<AiPostTopic> findAllOrdered() {
        return queryFactory
                .selectFrom(aiPostTopic)
                .join(aiPostTopic.category, category).fetchJoin()
                .orderBy(aiPostTopic.displayOrder.asc(), aiPostTopic.id.asc())
                .fetch();
    }
}
