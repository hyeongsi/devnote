package io.hyeongsi.devnotewebapp.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    private final ObjectMapper objectMapper = new ObjectMapper();

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
    void anonymousVisitorCanDeleteOwnCommentWithPassword() throws Exception {
        String slug = "comment-delete-security-" + System.nanoTime();
        HttpResponse<String> postResponse = sendJson("POST", "/api/posts", """
                {
                  "slug":"%s",
                  "categoryId":1,
                  "title":"Comment delete security test",
                  "excerpt":"Visitor comment delete request",
                  "readTime":"1 min",
                  "thumbnailStyle":"code",
                  "contentMarkdown":"Test body",
                  "tags":["test"]
                }
                """.formatted(slug));
        assertThat(postResponse.statusCode()).isEqualTo(201);

        HttpClient anonymousClient = HttpClient.newHttpClient();
        HttpResponse<String> createResponse = sendJson(
                anonymousClient,
                "POST",
                "/api/posts/spring-boot/" + slug + "/comments",
                """
                {"authorName":"visitor","password":"1234","content":"delete me"}
                """
        );
        assertThat(createResponse.statusCode()).isEqualTo(201);

        JsonNode comment = objectMapper.readTree(createResponse.body());
        HttpResponse<String> deleteResponse = sendJson(
                anonymousClient,
                "DELETE",
                "/api/posts/spring-boot/" + slug + "/comments/" + comment.get("id").asLong(),
                """
                {"password":"1234"}
                """
        );

        assertThat(deleteResponse.statusCode()).isEqualTo(204);
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
        return sendJson(client, method, path, body);
    }

    private HttpResponse<String> sendJson(HttpClient client, String method, String path, String body) throws Exception {
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
