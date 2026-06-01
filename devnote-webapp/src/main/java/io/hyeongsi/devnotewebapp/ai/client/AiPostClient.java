package io.hyeongsi.devnotewebapp.ai.client;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;

public interface AiPostClient {

    AiPostGenerateResponse generate(String topic);
}
