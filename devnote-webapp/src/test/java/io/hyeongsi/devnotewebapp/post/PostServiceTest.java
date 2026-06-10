package io.hyeongsi.devnotewebapp.post;

import io.hyeongsi.devnotewebapp.category.Category;
import io.hyeongsi.devnotewebapp.category.CategoryRepository;
import io.hyeongsi.devnotewebapp.comment.CommentRepository;
import io.hyeongsi.devnotewebapp.like.PostLikeRepository;
import io.hyeongsi.devnotewebapp.view.PostView;
import io.hyeongsi.devnotewebapp.view.PostViewRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PostServiceTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-06-08T12:00:00Z"),
            ZoneOffset.UTC
    );

    @Test
    void searchPostsMatchesTitleExcerptContentTagsAndCategory() {
        PostRepository postRepository = mock(PostRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        PostService postService = new PostService(
                postRepository,
                categoryRepository,
                commentRepository,
                postLikeRepository,
                postViewRepository,
                CLOCK
        );
        Category spring = new Category("spring-boot", "Spring Boot", "Spring Boot posts", true, 1);
        Category infra = new Category("infra", "Infra", "Infra posts", true, 2);
        Post contentMatch = new Post(
                "spring-security-practical-guide",
                spring,
                "Authentication overview",
                "Login flow summary",
                java.time.LocalDate.of(2026, 5, 20),
                "8 min read",
                3,
                "security",
                "Spring Security keeps requests protected.",
                List.of("auth", "backend")
        );
        Post categoryMatch = new Post(
                "docker-basics",
                infra,
                "Container basics",
                "Docker image workflow",
                java.time.LocalDate.of(2026, 5, 19),
                "5 min read",
                1,
                "docker",
                "Container runtime notes.",
                List.of("spring security")
        );
        Post miss = new Post(
                "react-state",
                infra,
                "React state",
                "UI state notes",
                java.time.LocalDate.of(2026, 5, 18),
                "4 min read",
                1,
                "code",
                "Client rendering notes.",
                List.of("frontend")
        );

        when(postRepository.findPostList()).thenReturn(List.of(contentMatch, categoryMatch, miss));

        List<PostSearchResponse> results = postService.searchPosts("spring security");

        assertThat(results)
                .extracting(PostSearchResponse::slug)
                .containsExactly("spring-security-practical-guide", "docker-basics");
        assertThat(results.get(0).matchedText()).isEqualTo("Spring Security keeps requests protected.");
    }

    @Test
    void deletePostDeletesExistingPost() {
        PostRepository postRepository = mock(PostRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        PostService postService = new PostService(
                postRepository,
                categoryRepository,
                commentRepository,
                postLikeRepository,
                postViewRepository,
                CLOCK
        );
        Post post = mock(Post.class);

        when(postRepository.findPostDetail("spring-boot", "delete-me"))
                .thenReturn(Optional.of(post));

        postService.deletePost("spring-boot", "delete-me");

        verify(commentRepository).deleteAllByPost(post);
        verify(postLikeRepository).deleteAllByPost(post);
        verify(postViewRepository).deleteAllByPost(post);
        verify(postRepository).delete(post);
    }

    @Test
    void deletePostThrowsNotFoundWhenPostDoesNotExist() {
        PostRepository postRepository = mock(PostRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        PostService postService = new PostService(
                postRepository,
                categoryRepository,
                commentRepository,
                postLikeRepository,
                postViewRepository,
                CLOCK
        );

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
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        PostService postService = new PostService(
                postRepository,
                categoryRepository,
                commentRepository,
                postLikeRepository,
                postViewRepository,
                CLOCK
        );
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

    @Test
    void getPostIncrementsViewCountAndRecordsViewEvent() {
        PostRepository postRepository = mock(PostRepository.class);
        CategoryRepository categoryRepository = mock(CategoryRepository.class);
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostLikeRepository postLikeRepository = mock(PostLikeRepository.class);
        PostViewRepository postViewRepository = mock(PostViewRepository.class);
        PostService postService = new PostService(
                postRepository,
                categoryRepository,
                commentRepository,
                postLikeRepository,
                postViewRepository,
                CLOCK
        );
        Post post = mock(Post.class);

        when(postRepository.findPostDetail("spring-boot", "viewed-post")).thenReturn(Optional.of(post));
        when(post.getId()).thenReturn(1L);
        when(post.getSlug()).thenReturn("viewed-post");
        when(post.getCategoryName()).thenReturn("Spring Boot");
        when(post.getCategorySlug()).thenReturn("spring-boot");
        when(post.getTitle()).thenReturn("Viewed post");
        when(post.getExcerpt()).thenReturn("Excerpt");
        when(post.getPublishedAt()).thenReturn(java.time.LocalDate.of(2026, 6, 8));
        when(post.getReadTime()).thenReturn("3 min");
        when(post.getViewCount()).thenReturn(11);
        when(post.getTags()).thenReturn(List.of("Spring"));
        when(post.getThumbnailStyle()).thenReturn("code");
        when(post.getContentMarkdown()).thenReturn("Content");

        PostDetailResponse response = postService.getPost("spring-boot", "viewed-post");

        verify(post).incrementViewCount();
        verify(postViewRepository).save(any(PostView.class));
        assertThat(response.viewCount()).isEqualTo(11);
    }
}
