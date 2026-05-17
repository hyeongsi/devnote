package io.hyeongsi.devnotewebapp.category;

public record BlogCategoryResponse(
        Long id,
        String slug,
        String name,
        String description,
        long count,
        boolean visible,
        int displayOrder
) {
}
