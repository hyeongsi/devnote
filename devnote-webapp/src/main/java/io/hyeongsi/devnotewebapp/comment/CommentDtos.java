package io.hyeongsi.devnotewebapp.comment;

import java.time.LocalDateTime;

public class CommentDtos {

    public record PublicCommentResponse(
            Long id,
            String authorName,
            String content,
            LocalDateTime createdAt
    ) {
        static PublicCommentResponse from(Comment comment) {
            return new PublicCommentResponse(
                    comment.getId(),
                    comment.getAuthorName(),
                    comment.getContent(),
                    comment.getCreatedAt()
            );
        }
    }

    public record CommentCreateRequest(
            String authorName,
            String password,
            String content
    ) {
    }

    public record CommentDeleteRequest(String password) {
    }

    public record AdminCommentResponse(
            Long id,
            Long postId,
            String postTitle,
            String categorySlug,
            String postSlug,
            String authorName,
            String content,
            boolean visible,
            LocalDateTime createdAt
    ) {
        static AdminCommentResponse from(Comment comment) {
            return new AdminCommentResponse(
                    comment.getId(),
                    comment.getPostId(),
                    comment.getPostTitle(),
                    comment.getCategorySlug(),
                    comment.getPostSlug(),
                    comment.getAuthorName(),
                    comment.getContent(),
                    comment.isVisible(),
                    comment.getCreatedAt()
            );
        }
    }
}
