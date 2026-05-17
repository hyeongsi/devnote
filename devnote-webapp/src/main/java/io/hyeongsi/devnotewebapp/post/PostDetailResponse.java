package io.hyeongsi.devnotewebapp.post;

import java.util.List;

public record PostDetailResponse(
        Long id,
        String slug,
        String categoryName,
        String categorySlug,
        String title,
        String excerpt,
        String displayDate,
        String readTime,
        Integer viewCount,
        List<String> tags,
        String thumbnailStyle,
        String contentMarkdown
) {
}
