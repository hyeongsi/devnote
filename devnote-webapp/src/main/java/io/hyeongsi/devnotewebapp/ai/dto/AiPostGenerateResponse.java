package io.hyeongsi.devnotewebapp.ai.dto;

import java.util.List;

public record AiPostGenerateResponse(
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
