package io.hyeongsi.devnotewebapp.ai.autopost;

import java.time.LocalDateTime;
import java.util.List;

public final class AiAutoPostingDtos {

    private AiAutoPostingDtos() {
    }

    public record TopicRequest(String name, Long categoryId, Boolean enabled, Integer displayOrder) {
    }

    public record TopicResponse(
            Long id,
            String name,
            Long categoryId,
            String categoryName,
            Boolean enabled,
            Integer displayOrder,
            LocalDateTime lastSucceededAt
    ) {
    }

    public record RunResponse(
            Long id,
            Long topicId,
            String topicName,
            Long postId,
            AiPostRunStatus status,
            String generatedTitle,
            String errorMessage,
            LocalDateTime startedAt,
            LocalDateTime completedAt
    ) {
    }

    public record StatusResponse(
            boolean enabled,
            boolean geminiConfigured,
            String model,
            String zone,
            String cron,
            LocalDateTime nextRunAt,
            TopicResponse nextTopic
    ) {
    }

    public record OrderRequest(List<Long> topicIds) {
    }
}
