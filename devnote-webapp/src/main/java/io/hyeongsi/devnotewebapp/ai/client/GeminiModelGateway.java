package io.hyeongsi.devnotewebapp.ai.client;

import com.google.genai.types.GenerateContentConfig;

@FunctionalInterface
interface GeminiModelGateway {

    GeminiModelResult generate(String prompt, GenerateContentConfig config);
}
