package io.hyeongsi.devnotewebapp.comment;

import io.hyeongsi.devnotewebapp.comment.CommentDtos.AdminCommentResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/comments")
public class CommentAdminController {

    private final CommentService commentService;

    public CommentAdminController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public List<AdminCommentResponse> getComments() {
        return commentService.getAdminComments();
    }

    @DeleteMapping("/{commentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteComment(@PathVariable Long commentId) {
        commentService.deleteCommentByAdmin(commentId);
    }
}
