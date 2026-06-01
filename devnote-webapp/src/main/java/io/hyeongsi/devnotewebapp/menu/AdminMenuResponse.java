package io.hyeongsi.devnotewebapp.menu;

public record AdminMenuResponse(
        Long id,
        String name,
        String path,
        String state,
        Boolean visible,
        Integer displayOrder,
        String area,
        Long parentId,
        Integer depth
) {
}
