package io.hyeongsi.devnotewebapp.ai.client;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;

public class OpenAiPostClient implements AiPostClient {

    @Override
    public AiPostGenerateResponse generate(AiPostGenerationContext context) {
        throw new UnsupportedOperationException("OpenAI integration is not enabled yet. Configure it with environment variables later.");
    }
}
