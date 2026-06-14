package io.hyeongsi.devnotewebapp.ai.client;

import java.util.List;

public record AiPostGenerationContext(
        String topic,
        String direction,
        List<String> keywords,
        List<String> excludedKeywords,
        String level,
        String lengthHint,
        String categorySlug,
        List<String> recentTitles
) {
    public static AiPostGenerationContext manual(String topic) {
        return new AiPostGenerationContext(topic, "", List.of(), List.of(), "초급도 이해할 수 있게", "보통", "", List.of());
    }
}
