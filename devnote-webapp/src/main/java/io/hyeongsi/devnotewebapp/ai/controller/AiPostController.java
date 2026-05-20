package io.hyeongsi.devnotewebapp.ai.controller;

import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateRequest;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.ai.service.AiPostGenerateService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/posts")
public class AiPostController {

    private final AiPostGenerateService aiPostGenerateService;

    public AiPostController(AiPostGenerateService aiPostGenerateService) {
        this.aiPostGenerateService = aiPostGenerateService;
    }

    @PostMapping("/generate")
    public AiPostGenerateResponse generate(@RequestBody AiPostGenerateRequest request) {
        return aiPostGenerateService.generate(request.topic());
    }
}
