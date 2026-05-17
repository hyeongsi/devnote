package io.hyeongsi.devnotewebapp.auth;

public record AuthUserResponse(
        String email,
        String role
) {
}
