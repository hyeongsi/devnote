package io.hyeongsi.devnotewebapp.post;

import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.category.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PostServiceTest {

    @Test
    void deletePostDeletesExistingPost() {
        PostRepository postRepository = mock(PostRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        PostService postService = new PostService(postRepository, categoryRepository);
        Post post = mock(Post.class);

        when(postRepository.findPostDetail("spring-boot", "delete-me"))
                .thenReturn(Optional.of(post));

        postService.deletePost("spring-boot", "delete-me");

        verify(postRepository).delete(post);
    }

    @Test
    void deletePostThrowsNotFoundWhenPostDoesNotExist() {
        PostRepository postRepository = mock(PostRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        PostService postService = new PostService(postRepository, categoryRepository);

        when(postRepository.findPostDetail("spring-boot", "missing"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> postService.deletePost("spring-boot", "missing"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Post not found");
    }

    @Test
    void createPostSavesNewPostWithCategoryAndTags() {
        PostRepository postRepository = mock(PostRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        PostService postService = new PostService(postRepository, categoryRepository);
        Category category = new Category("spring-boot", "Spring Boot", "Spring Boot posts", true, 1);
        PostCreateRequest request = new PostCreateRequest(
                "spring-security-practical-guide",
                1L,
                "Spring Security를 실무 관점에서 이해하기",
                "Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.",
                "8분 읽기",
                "laptop",
                "## Spring Security란?\n\n본문입니다.",
                List.of("Spring Security", "인증", "인가")
        );

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(postRepository.existsBySlug("spring-security-practical-guide")).thenReturn(false);
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PostDetailResponse response = postService.createPost(request);

        assertThat(response.slug()).isEqualTo("spring-security-practical-guide");
        assertThat(response.categorySlug()).isEqualTo("spring-boot");
        assertThat(response.viewCount()).isZero();
        assertThat(response.tags()).containsExactly("Spring Security", "인증", "인가");
        verify(postRepository).save(any(Post.class));
    }
}
