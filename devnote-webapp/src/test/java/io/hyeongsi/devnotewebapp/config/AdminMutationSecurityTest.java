package io.hyeongsi.devnotewebapp.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class AdminMutationSecurityTest {

    @LocalServerPort
    private int port;

    private HttpClient client;

    @BeforeEach
    void logInAsAdmin() throws Exception {
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        client = HttpClient.newBuilder().cookieHandler(cookies).build();

        HttpResponse<String> response = sendJson("POST", "/api/auth/login", """
                {"email":"admin@devnote.dev","password":"devnote-admin-1234"}
                """);

        assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    void authenticatedAdminCanCreatePost() throws Exception {
        HttpResponse<String> response = sendJson("POST", "/api/posts", """
                {
                  "slug":"security-integration-test",
                  "categoryId":1,
                  "title":"Security integration test",
                  "excerpt":"Mutation request",
                  "readTime":"1분",
                  "thumbnailStyle":"code",
                  "contentMarkdown":"Test body",
                  "tags":["test"]
                }
                """);

        assertThat(response.statusCode()).isEqualTo(201);
    }

    @Test
    void authenticatedAdminCanSaveCategories() throws Exception {
        String categories = get("/api/categories/admin").body();

        HttpResponse<String> response = sendJson("PUT", "/api/categories/admin", categories);

        assertThat(response.statusCode()).isEqualTo(200);
    }

    @Test
    void authenticatedAdminCanSaveMenus() throws Exception {
        String menus = get("/api/menus/admin").body();

        HttpResponse<String> response = sendJson("PUT", "/api/menus/admin", menus);

        assertThat(response.statusCode()).isEqualTo(200);
    }

    private HttpResponse<String> get(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path)).GET().build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> sendJson(String method, String path, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(uri(path))
                .header("Content-Type", "application/json")
                .method(method, HttpRequest.BodyPublishers.ofString(body))
                .build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private URI uri(String path) {
        return URI.create("http://127.0.0.1:" + port + path);
    }
}
