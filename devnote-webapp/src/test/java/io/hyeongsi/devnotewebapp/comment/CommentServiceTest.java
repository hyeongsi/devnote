package io.hyeongsi.devnotewebapp.comment;

import io.hyeongsi.devnotewebapp.comment.CommentDtos.CommentCreateRequest;
import io.hyeongsi.devnotewebapp.comment.CommentDtos.CommentDeleteRequest;
import io.hyeongsi.devnotewebapp.comment.CommentDtos.PublicCommentResponse;
import io.hyeongsi.devnotewebapp.post.Post;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CommentServiceTest {

    @Test
    void createCommentStoresPasswordHashAndReturnsPublicComment() {
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        Post post = post();
        CommentService service = new CommentService(
                commentRepository,
                postRepository,
                new BCryptPasswordEncoder()
        );

        when(postRepository.findPostDetail("spring-boot", "comment-post")).thenReturn(Optional.of(post));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            ReflectionTestUtils.setField(comment, "id", 10L);
            comment.prePersist();
            return comment;
        });

        PublicCommentResponse response = service.createComment(
                "spring-boot",
                "comment-post",
                new CommentCreateRequest(" 방문자 ", "1234", " 좋은 글입니다. ")
        );

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.authorName()).isEqualTo("방문자");
        assertThat(response.content()).isEqualTo("좋은 글입니다.");
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void deleteCommentDeletesWhenPasswordMatches() {
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        Post post = post();
        Comment comment = new Comment(post, "방문자", "좋은 글입니다.", passwordEncoder.encode("1234"));
        ReflectionTestUtils.setField(comment, "id", 10L);
        CommentService service = new CommentService(commentRepository, postRepository, passwordEncoder);

        when(postRepository.findPostDetail("spring-boot", "comment-post")).thenReturn(Optional.of(post));
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        service.deleteComment(
                "spring-boot",
                "comment-post",
                10L,
                new CommentDeleteRequest("1234")
        );

        verify(commentRepository).delete(comment);
    }

    @Test
    void deleteCommentRejectsWrongPassword() {
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        Post post = post();
        Comment comment = new Comment(post, "방문자", "좋은 글입니다.", passwordEncoder.encode("1234"));
        ReflectionTestUtils.setField(comment, "id", 10L);
        CommentService service = new CommentService(commentRepository, postRepository, passwordEncoder);

        when(postRepository.findPostDetail("spring-boot", "comment-post")).thenReturn(Optional.of(post));
        when(commentRepository.findById(10L)).thenReturn(Optional.of(comment));

        assertThatThrownBy(() -> service.deleteComment(
                "spring-boot",
                "comment-post",
                10L,
                new CommentDeleteRequest("wrong")
        )).isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");

        verify(commentRepository, never()).delete(any(Comment.class));
    }

    @Test
    void getPublicCommentsReturnsVisibleCommentsInRepositoryOrder() {
        CommentRepository commentRepository = mock(CommentRepository.class);
        PostRepository postRepository = mock(PostRepository.class);
        Post post = post();
        Comment comment = new Comment(post, "방문자", "좋은 글입니다.", "hash");
        ReflectionTestUtils.setField(comment, "id", 10L);
        comment.prePersist();
        CommentService service = new CommentService(
                commentRepository,
                postRepository,
                new BCryptPasswordEncoder()
        );

        when(postRepository.findPostDetail("spring-boot", "comment-post")).thenReturn(Optional.of(post));
        when(commentRepository.findByPostAndVisibleTrueOrderByCreatedAtAscIdAsc(post))
                .thenReturn(List.of(comment));

        List<PublicCommentResponse> responses = service.getPublicComments("spring-boot", "comment-post");

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().authorName()).isEqualTo("방문자");
    }

    private Post post() {
        Post post = mock(Post.class);
        when(post.getId()).thenReturn(1L);
        when(post.getTitle()).thenReturn("댓글 테스트 글");
        when(post.getSlug()).thenReturn("comment-post");
        when(post.getCategorySlug()).thenReturn("spring-boot");
        return post;
    }
}
