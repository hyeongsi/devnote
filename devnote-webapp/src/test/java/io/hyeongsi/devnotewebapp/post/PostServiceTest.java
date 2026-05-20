package io.hyeongsi.devnotewebapp.post;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PostServiceTest {

    @Test
    void deletePostDeletesExistingPost() {
        PostRepository postRepository = mock(PostRepository.class);
        PostService postService = new PostService(postRepository);
        Post post = mock(Post.class);

        when(postRepository.findPostDetail("spring-boot", "delete-me"))
                .thenReturn(Optional.of(post));

        postService.deletePost("spring-boot", "delete-me");

        verify(postRepository).delete(post);
    }

    @Test
    void deletePostThrowsNotFoundWhenPostDoesNotExist() {
        PostRepository postRepository = mock(PostRepository.class);
        PostService postService = new PostService(postRepository);

        when(postRepository.findPostDetail("spring-boot", "missing"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.deletePost("spring-boot", "missing"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Post not found");
    }
}
