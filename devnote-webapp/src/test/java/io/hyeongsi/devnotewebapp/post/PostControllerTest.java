package io.hyeongsi.devnotewebapp.post;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostControllerTest {

    @Test
    void deletePostDeletesByCategoryAndSlug() throws Exception {
        PostService postService = mock(PostService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new PostController(postService)).build();

        mockMvc.perform(delete("/api/posts/spring-boot/delete-me"))
                .andExpect(status().isNoContent());

        verify(postService).deletePost("spring-boot", "delete-me");
    }

    @Test
    void createPostReturnsCreatedPost() throws Exception {
        PostService postService = mock(PostService.class);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new PostController(postService)).build();
        PostCreateRequest request = new PostCreateRequest(
                "spring-security-practical-guide",
                1L,
                "Spring Security를 실무 관점에서 이해하기",
                "Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.",
                "8분 읽기",
                "laptop",
                "## Spring Security란?\n\n본문입니다.",
                List.of("Spring Security", "인증")
        );

        when(postService.createPost(request)).thenReturn(new PostDetailResponse(
                10L,
                "spring-security-practical-guide",
                "Spring Boot",
                "spring-boot",
                "Spring Security를 실무 관점에서 이해하기",
                "Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.",
                "2026.05.20",
                "8분 읽기",
                0,
                List.of("Spring Security", "인증"),
                "laptop",
                "## Spring Security란?\n\n본문입니다."
        ));

        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "slug": "spring-security-practical-guide",
                                  "categoryId": 1,
                                  "title": "Spring Security를 실무 관점에서 이해하기",
                                  "excerpt": "Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.",
                                  "readTime": "8분 읽기",
                                  "thumbnailStyle": "laptop",
                                  "contentMarkdown": "## Spring Security란?\\n\\n본문입니다.",
                                  "tags": ["Spring Security", "인증"]
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value("spring-security-practical-guide"))
                .andExpect(jsonPath("$.viewCount").value(0))
                .andExpect(jsonPath("$.tags[1]").value("인증"));

        verify(postService).createPost(request);
    }
}
