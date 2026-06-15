package io.hyeongsi.devnotewebapp.ai.autopost;

import com.querydsl.jpa.impl.JPAQueryFactory;

import java.time.LocalDateTime;
import java.util.List;

import static io.hyeongsi.devnotewebapp.ai.autopost.QAiPostRun.aiPostRun;
import static io.hyeongsi.devnotewebapp.ai.autopost.QAiPostTopic.aiPostTopic;

public class AiPostRunRepositoryImpl implements AiPostRunRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    public AiPostRunRepositoryImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }

    @Override
    public boolean existsSucceededBetween(LocalDateTime start, LocalDateTime end) {
        return queryFactory
                .selectOne()
                .from(aiPostRun)
                .where(
                        aiPostRun.status.eq(AiPostRunStatus.SUCCEEDED),
                        aiPostRun.startedAt.goe(start),
                        aiPostRun.startedAt.lt(end)
                )
                .fetchFirst() != null;
    }

    @Override
    public boolean existsRunning() {
        return queryFactory
                .selectOne()
                .from(aiPostRun)
                .where(aiPostRun.status.eq(AiPostRunStatus.RUNNING))
                .fetchFirst() != null;
    }

    @Override
    public List<AiPostRun> findRecentRuns(int limit) {
        return queryFactory
                .selectFrom(aiPostRun)
                .leftJoin(aiPostRun.topic, aiPostTopic).fetchJoin()
                .orderBy(aiPostRun.startedAt.desc(), aiPostRun.id.desc())
                .limit(limit)
                .fetch();
    }

    @Override
    public List<String> findRecentGeneratedTitles(
            AiPostTopic topic,
            AiPostRunStatus status,
            int limit
    ) {
        return queryFactory
                .select(aiPostRun.generatedTitle)
                .from(aiPostRun)
                .where(
                        aiPostRun.topic.eq(topic),
                        aiPostRun.status.eq(status),
                        aiPostRun.generatedTitle.isNotNull(),
                        aiPostRun.generatedTitle.ne("")
                )
                .orderBy(aiPostRun.completedAt.desc(), aiPostRun.id.desc())
                .limit(limit)
                .fetch();
    }
}
