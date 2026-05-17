package io.hyeongsi.devnotewebapp.category;

public record AdminCategoryResponse(
        Long id,
        String slug,
        String name,
        String description,
        long postCount,
        boolean visible,
        int displayOrder
) {
}
