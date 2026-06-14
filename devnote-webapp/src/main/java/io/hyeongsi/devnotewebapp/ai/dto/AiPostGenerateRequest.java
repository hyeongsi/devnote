package io.hyeongsi.devnotewebapp.ai.dto;

import java.util.List;

public record AiPostGenerateRequest(
        String topic,
        String direction,
        List<String> keywords,
        List<String> excludedKeywords,
        String level,
        String lengthHint
) {
}
