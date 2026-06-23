package io.hyeongsi.devnotewebapp.ai.autopost;

import io.hyeongsi.devnotewebapp.ai.draft.AiPostDraftDtos;
import io.hyeongsi.devnotewebapp.post.PostCreateRequest;
import io.hyeongsi.devnotewebapp.post.PostDetailResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AiAutoPostingControllerTest {

    @Test
    void draftEndpointsReturnLoadableDraftAndPublishedPost() throws Exception {
        AiAutoPostingAdminService service = mock(AiAutoPostingAdminService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new AiAutoPostingController(service)).build();
        AiPostDraftDtos.DraftDetail detail = new AiPostDraftDtos.DraftDetail(
                41L, "Spring Security", "title", "summary", "## content",
                List.of("Security"), "8분 읽기", List.of("OAuth2"), "spring", "laptop"
        );
        PostDetailResponse saved = new PostDetailResponse(
                99L, "spring-security", "Spring", "spring", "title", "summary",
                "2026.06.23", "8분 읽기", 0, List.of("Security"), "laptop", "## content"
        );
        when(service.draft(41L)).thenReturn(detail);
        when(service.publishDraft(
                org.mockito.ArgumentMatchers.eq(41L),
                org.mockito.ArgumentMatchers.any(AiPostDraftDtos.PublishDraftRequest.class)
        )).thenReturn(saved);

        mockMvc.perform(get("/api/admin/ai-posting/drafts/41"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.topic").value("Spring Security"));

        mockMvc.perform(post("/api/admin/ai-posting/drafts/41/publish")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"post":{"slug":"spring-security","categoryId":1,"title":"title","excerpt":"summary","readTime":"8분 읽기","thumbnailStyle":"laptop","contentMarkdown":"## content","tags":["Security"]}}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(99));
    }
}
