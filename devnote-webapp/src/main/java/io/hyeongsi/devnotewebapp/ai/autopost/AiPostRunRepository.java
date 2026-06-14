package io.hyeongsi.devnotewebapp.ai.autopost;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AiPostRunRepository extends JpaRepository<AiPostRun, Long> {
    boolean existsByStatusAndStartedAtGreaterThanEqualAndStartedAtLessThan(
            AiPostRunStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsByStatus(AiPostRunStatus status);

    List<AiPostRun> findTop20ByOrderByStartedAtDesc();

    List<AiPostRun> findTop5ByTopicAndStatusOrderByCompletedAtDesc(
            AiPostTopic topic,
            AiPostRunStatus status
    );
}
