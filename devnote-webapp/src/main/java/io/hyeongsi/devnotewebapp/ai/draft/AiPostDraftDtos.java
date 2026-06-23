package io.hyeongsi.devnotewebapp.ai.draft;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.post.PostCreateRequest;

import java.time.LocalDateTime;
import java.util.List;

public final class AiPostDraftDtos {

    private AiPostDraftDtos() {
    }

    public record GeneratedDraft(Long draftId, AiPostGenerateResponse result) {
    }

    public record DraftDetail(
            Long id,
            String topic,
            String title,
            String summary,
            String content,
            List<String> tags,
            String readTime,
            List<String> recommendedTopics,
            String recommendedCategorySlug,
            String thumbnailStyle
    ) {
    }

    public record HistoryItem(
            String key,
            Long draftId,
            String topic,
            String status,
            boolean loadable,
            LocalDateTime occurredAt,
            String errorMessage
    ) {
    }

    public record PublishDraftRequest(PostCreateRequest post) {
    }
}
