package io.hyeongsi.devnotewebapp.ai.client;

import java.util.List;
import java.util.Objects;

record GeminiGeneratedUnit(
        String contentKey,
        String heading,
        String brief,
        int depth,
        String markdown,
        List<GeminiGeneratedUnit> children
) {
    GeminiGeneratedUnit {
        contentKey = requireText(contentKey, "contentKey");
        heading = requireText(heading, "heading");
        brief = requireText(brief, "brief");
        if (depth < 3) {
            throw new IllegalArgumentException("depth must be at least 3");
        }
        markdown = markdown == null ? null : requireText(markdown, "markdown");
        children = children == null ? List.of() : List.copyOf(children);
        if (markdown != null && !children.isEmpty()) {
            throw new IllegalArgumentException("a generated unit cannot have markdown and children");
        }
    }

    static GeminiGeneratedUnit completed(
            String contentKey,
            String heading,
            String brief,
            int depth,
            String markdown
    ) {
        return new GeminiGeneratedUnit(contentKey, heading, brief, depth, markdown, List.of());
    }

    static GeminiGeneratedUnit branch(
            String contentKey,
            String heading,
            String brief,
            int depth,
            List<GeminiGeneratedUnit> children
    ) {
        if (children == null || children.isEmpty()) {
            throw new IllegalArgumentException("branch children must not be empty");
        }
        return new GeminiGeneratedUnit(contentKey, heading, brief, depth, null, children);
    }

    static GeminiGeneratedUnit leaf(String contentKey, String heading, String brief, int depth) {
        return new GeminiGeneratedUnit(contentKey, heading, brief, depth, null, List.of());
    }

    boolean completed() {
        return markdown != null;
    }

    boolean branch() {
        return !children.isEmpty();
    }

    boolean leaf() {
        return children.isEmpty();
    }

    List<GeminiGeneratedUnit> leaves() {
        if (leaf()) {
            return List.of(this);
        }
        return children.stream().flatMap(child -> child.leaves().stream()).toList();
    }

    GeminiGeneratedUnit replaceLeaf(String targetContentKey, GeminiGeneratedUnit replacement) {
        Objects.requireNonNull(replacement, "replacement");
        if (children.isEmpty()) {
            return contentKey.equals(targetContentKey) ? replacement : this;
        }
        List<GeminiGeneratedUnit> replacedChildren = children.stream()
                .map(child -> child.replaceLeaf(targetContentKey, replacement))
                .toList();
        return new GeminiGeneratedUnit(contentKey, heading, brief, depth, null, replacedChildren);
    }

    private static String requireText(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " must not be blank");
        }
        return value.strip();
    }
}
