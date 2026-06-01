package io.hyeongsi.devnotewebapp.ai;

import io.hyeongsi.devnotewebapp.ai.controller.AiPostController;
import io.hyeongsi.devnotewebapp.ai.dto.AiPostGenerateResponse;
import io.hyeongsi.devnotewebapp.ai.service.AiPostGenerateService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AiPostControllerTest {

    @Test
    void generatePostDraftReturnsAiResponse() throws Exception {
        AiPostGenerateService service = mock(AiPostGenerateService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new AiPostController(service)).build();

        when(service.generate("Spring Security")).thenReturn(new AiPostGenerateResponse(
                "Spring Security를 실무 관점에서 이해하기",
                "Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.",
                "## Spring Security란?\n\n학습형 본문입니다.",
                List.of("Spring Security", "Spring Boot"),
                "8분 읽기",
                List.of("JWT 인증 방식", "OAuth2 로그인"),
                "spring-boot",
                "laptop"
        ));

        mockMvc.perform(post("/api/ai/posts/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"topic":"Spring Security"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Spring Security를 실무 관점에서 이해하기"))
                .andExpect(jsonPath("$.tags[0]").value("Spring Security"))
                .andExpect(jsonPath("$.recommendedCategorySlug").value("spring-boot"));

        verify(service).generate("Spring Security");
    }
}
