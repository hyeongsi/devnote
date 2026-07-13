package io.hyeongsi.devnotewebapp.comment;

import io.hyeongsi.devnotewebapp.comment.CommentDtos.AdminCommentResponse;
import io.hyeongsi.devnotewebapp.comment.CommentDtos.CommentCreateRequest;
import io.hyeongsi.devnotewebapp.comment.CommentDtos.CommentDeleteRequest;
import io.hyeongsi.devnotewebapp.comment.CommentDtos.PublicCommentResponse;
import io.hyeongsi.devnotewebapp.post.Post;
import io.hyeongsi.devnotewebapp.post.PostRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CommentService {

    private static final int MAX_AUTHOR_NAME_LENGTH = 80;
    private static final int MAX_CONTENT_LENGTH = 2000;
    private static final int MIN_PASSWORD_LENGTH = 4;
    private static final int MAX_PASSWORD_LENGTH = 50;

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final PasswordEncoder passwordEncoder;

    public CommentService(
            CommentRepository commentRepository,
            PostRepository postRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<PublicCommentResponse> getPublicComments(String categorySlug, String postSlug) {
        Post post = findPost(categorySlug, postSlug);
        return commentRepository.findByPostAndVisibleTrueOrderByCreatedAtAscIdAsc(post)
                .stream()
                .map(PublicCommentResponse::from)
                .toList();
    }

    @Transactional
    public PublicCommentResponse createComment(String categorySlug, String postSlug, CommentCreateRequest request) {
        Post post = findPost(categorySlug, postSlug);
        String authorName = validateText(request.authorName(), "작성자 이름", MAX_AUTHOR_NAME_LENGTH);
        String content = validateText(request.content(), "댓글 내용", MAX_CONTENT_LENGTH);
        String password = validatePassword(request.password());

        Comment comment = commentRepository.save(new Comment(
                post,
                authorName,
                content,
                passwordEncoder.encode(password)
        ));
        return PublicCommentResponse.from(comment);
    }

    @Transactional
    public void deleteComment(String categorySlug, String postSlug, Long commentId, CommentDeleteRequest request) {
        findPost(categorySlug, postSlug);
        Comment comment = findComment(commentId);

        if (!comment.getCategorySlug().equals(categorySlug) || !comment.getPostSlug().equals(postSlug)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found");
        }

        String password = validatePassword(request.password());
        if (!passwordEncoder.matches(password, comment.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Comment password does not match");
        }

        commentRepository.delete(comment);
    }

    public List<AdminCommentResponse> getAdminComments() {
        return commentRepository.findAllByOrderByCreatedAtDescIdDesc()
                .stream()
                .map(AdminCommentResponse::from)
                .toList();
    }

    @Transactional
    public void deleteCommentByAdmin(Long commentId) {
        commentRepository.delete(findComment(commentId));
    }

    private Post findPost(String categorySlug, String postSlug) {
        return postRepository.findPostDetail(categorySlug, postSlug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private Comment findComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));
    }

    private String validateText(String value, String label, int maxLength) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + "을 입력해 주세요.");
        }
        if (trimmed.length() > maxLength) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + "은 " + maxLength + "자 이하로 입력해 주세요.");
        }
        return trimmed;
    }

    private String validatePassword(String value) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.length() < MIN_PASSWORD_LENGTH || trimmed.length() > MAX_PASSWORD_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "댓글 비밀번호는 " + MIN_PASSWORD_LENGTH + "~" + MAX_PASSWORD_LENGTH + "자로 입력해 주세요."
            );
        }
        return trimmed;
    }
}
