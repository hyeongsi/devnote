package io.hyeongsi.devnotewebapp.auth;

public record AuthLoginRequest(
        String email,
        String password
) {
}
