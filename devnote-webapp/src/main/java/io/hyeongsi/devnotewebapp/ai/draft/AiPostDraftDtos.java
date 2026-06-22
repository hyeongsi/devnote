package io.hyeongsi.devnotewebapp.ai.draft;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;

public final class AiPostDraftDtos {

    private AiPostDraftDtos() {
    }

    public record GeneratedDraft(Long draftId, AiPostGenerateResponse result) {
    }
}
