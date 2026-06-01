package io.hyeongsi.devnotewebapp.ai.client;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;

public class OpenAiPostClient implements AiPostClient {

    @Override
    public AiPostGenerateResponse generate(String topic) {
        throw new UnsupportedOperationException("OpenAI integration is not enabled yet. Configure it with environment variables later.");
    }
}
