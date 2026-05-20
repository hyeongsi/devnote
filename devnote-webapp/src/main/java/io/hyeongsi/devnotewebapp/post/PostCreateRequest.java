package io.hyeongsi.devnotewebapp.post;

import java.util.List;

public record PostCreateRequest(
        String slug,
        Long categoryId,
        String title,
        String excerpt,
        String readTime,
        String thumbnailStyle,
        String contentMarkdown,
        List<String> tags
) {
}
