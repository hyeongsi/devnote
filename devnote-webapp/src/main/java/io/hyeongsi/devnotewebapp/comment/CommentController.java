package io.hyeongsi.devnotewebapp.comment;

import io.hyeongsi.devnotewebapp.comment.CommentDtos.CommentCreateRequest;
import io.hyeongsi.devnotewebapp.comment.CommentDtos.CommentDeleteRequest;
import io.hyeongsi.devnotewebapp.comment.CommentDtos.PublicCommentResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/posts/{categorySlug}/{postSlug}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<PublicCommentResponse> getComments(
            @PathVariable String categorySlug,
            @PathVariable String postSlug
    ) {
        return commentService.getPublicComments(categorySlug, postSlug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PublicCommentResponse createComment(
            @PathVariable String categorySlug,
            @PathVariable String postSlug,
            @RequestBody CommentCreateRequest request
    ) {
        return commentService.createComment(categorySlug, postSlug, request);
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(
            @PathVariable String categorySlug,
            @PathVariable String postSlug,
            @PathVariable Long commentId,
            @RequestBody CommentDeleteRequest request
    ) {
        commentService.deleteComment(categorySlug, postSlug, commentId, request);
    }
}
