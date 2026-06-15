package io.hyeongsi.devnotewebapp.ai.autopost;

import java.time.LocalDateTime;
import java.util.List;

public interface AiPostRunRepositoryCustom {

    boolean existsSucceededBetween(LocalDateTime start, LocalDateTime end);

    boolean existsRunning();

    List<AiPostRun> findRecentRuns(int limit);

    List<String> findRecentGeneratedTitles(
            AiPostTopic topic,
            AiPostRunStatus status,
            int limit
    );
}
