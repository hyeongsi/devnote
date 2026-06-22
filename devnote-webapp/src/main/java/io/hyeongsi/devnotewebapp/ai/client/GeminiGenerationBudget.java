package io.hyeongsi.devnotewebapp.ai.client;

final class GeminiGenerationBudget {

    private final int maximum;
    private int used;

    GeminiGenerationBudget(int maximum) {
        if (maximum < 1) {
            throw new IllegalArgumentException("maximum must be at least 1");
        }
        this.maximum = maximum;
    }

    void consume(String stage, String contentKey) {
        if (used >= maximum) {
            throw new IllegalStateException(
                    "Gemini generation call limit exceeded: stage=" + stage + ", contentKey=" + contentKey
            );
        }
        used++;
    }
}
