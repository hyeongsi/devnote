package io.hyeongsi.devnotewebapp.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(OutputCaptureExtension.class)
class RequestErrorLoggingFilterTest {

    @Test
    void logsServerErrorResponses(CapturedOutput output) throws Exception {
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/posts");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestFilterChain chain = (servletRequest, servletResponse) ->
                ((MockHttpServletResponse) servletResponse).setStatus(503)
        ;

        filter.doFilter(request, response, chain);

        assertThat(output).contains("request failed");
        assertThat(output).contains("method=GET");
        assertThat(output).contains("path=/api/posts");
        assertThat(output).contains("status=503");
        assertThat(output).contains("durationMs=");
    }

    @Test
    void logsUnhandledExceptionsWithoutSwallowingThem(CapturedOutput output) {
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/ai-posting/run");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestFilterChain chain = (servletRequest, servletResponse) -> {
            throw new ServletException("boom");
        };

        assertThatThrownBy(() -> filter.doFilter(request, response, chain))
                .isInstanceOf(ServletException.class)
                .hasMessage("boom");

        assertThat(output).contains("request failed");
        assertThat(output).contains("method=POST");
        assertThat(output).contains("path=/api/admin/ai-posting/run");
        assertThat(output).contains("errorType=ServletException");
    }

    @Test
    void doesNotLogClientErrorResponses(CapturedOutput output) throws Exception {
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestFilterChain chain = (servletRequest, servletResponse) ->
                ((MockHttpServletResponse) servletResponse).setStatus(404)
        ;

        filter.doFilter(request, response, chain);

        assertThat(output).doesNotContain("request failed");
    }

    @FunctionalInterface
    private interface TestFilterChain extends jakarta.servlet.FilterChain {
        @Override
        void doFilter(ServletRequest request, ServletResponse response) throws IOException, ServletException;
    }
}
