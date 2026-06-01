package io.hyeongsi.devnotewebapp.post;

public record PostSearchResponse(
        Long id,
        String slug,
        String categoryName,
        String categorySlug,
        String title,
        String excerpt,
        String displayDate,
        String matchedText
) {
}
