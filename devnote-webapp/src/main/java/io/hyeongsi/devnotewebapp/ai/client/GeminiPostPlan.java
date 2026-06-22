package io.hyeongsi.devnotewebapp.ai.client;

import java.util.List;

record GeminiPostPlan(
        String title,
        String summary,
        List<String> tags,
        String readTime,
        List<String> recommendedTopics,
        String recommendedCategorySlug,
        String thumbnailStyle,
        List<Section> sections
) {
    record Section(String key, String heading, String brief, List<Unit> units) {
    }

    record Unit(String key, String heading, String brief) {
    }
}
