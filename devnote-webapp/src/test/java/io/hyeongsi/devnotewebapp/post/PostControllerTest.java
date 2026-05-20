package io.hyeongsi.devnotewebapp.post;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
}
