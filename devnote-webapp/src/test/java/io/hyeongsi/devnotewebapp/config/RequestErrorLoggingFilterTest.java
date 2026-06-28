package io.hyeongsi.devnotewebapp.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import io.hyeongsi.devnotewebapp.errorlog.ErrorLogRecorder;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class RequestErrorLoggingFilterTest {

    @Test
    void logsServerErrorResponses(CapturedOutput output) throws Exception {
        ErrorLogRecorder recorder = mock(ErrorLogRecorder.class);
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter(recorder);
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
        verify(recorder).recordResponse(eq(request), eq(response), anyLong());
    }

    @Test
    void logsClientErrorResponses(CapturedOutput output) throws Exception {
        ErrorLogRecorder recorder = mock(ErrorLogRecorder.class);
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter(recorder);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin");
        MockHttpServletResponse response = new MockHttpServletResponse();
        TestFilterChain chain = (servletRequest, servletResponse) ->
                ((MockHttpServletResponse) servletResponse).setStatus(404)
        ;

        filter.doFilter(request, response, chain);

        assertThat(output).contains("request failed");
        assertThat(output).contains("status=404");
        verify(recorder).recordResponse(eq(request), eq(response), anyLong());
    }

    @Test
    void logsUnhandledExceptionsWithoutSwallowingThem(CapturedOutput output) {
        ErrorLogRecorder recorder = mock(ErrorLogRecorder.class);
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter(recorder);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/ai-posting/run");
        MockHttpServletResponse response = new MockHttpServletResponse();
        ServletException exception = new ServletException("boom");
        TestFilterChain chain = (servletRequest, servletResponse) -> {
            throw exception;
        };

        assertThatThrownBy(() -> filter.doFilter(request, response, chain))
                .isInstanceOf(ServletException.class)
                .hasMessage("boom");

        assertThat(output).contains("request failed");
        assertThat(output).contains("method=POST");
        assertThat(output).contains("path=/api/admin/ai-posting/run");
        assertThat(output).contains("errorType=ServletException");
        verify(recorder).recordException(eq(request), eq(500), eq(exception), anyLong());
    }

    @Test
    void logsClientErrorExceptionsWithTheirActualStatus(CapturedOutput output) {
        ErrorLogRecorder recorder = mock(ErrorLogRecorder.class);
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter(recorder);
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/error-logs");
        MockHttpServletResponse response = new MockHttpServletResponse();
        RuntimeException exception = new IllegalArgumentException("bad request");
        response.setStatus(400);
        TestFilterChain chain = (servletRequest, servletResponse) -> {
            ((MockHttpServletResponse) servletResponse).setStatus(400);
            throw exception;
        };

        assertThatThrownBy(() -> filter.doFilter(request, response, chain))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("bad request");

        assertThat(output).contains("request failed");
        assertThat(output).contains("status=400");
        verify(recorder).recordException(eq(request), eq(400), eq(exception), anyLong());
    }

    @Test
    void doesNotRecordResponseAgainWhenAdviceAlreadyRecordedIt() throws Exception {
        ErrorLogRecorder recorder = mock(ErrorLogRecorder.class);
        RequestErrorLoggingFilter filter = new RequestErrorLoggingFilter(recorder);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/error-logs");
        MockHttpServletResponse response = new MockHttpServletResponse();
        when(recorder.isRecorded(request)).thenReturn(true);
        TestFilterChain chain = (servletRequest, servletResponse) -> {
            servletRequest.setAttribute(ErrorLogRecorder.ERROR_LOG_RECORDED_ATTRIBUTE, Boolean.TRUE);
            ((MockHttpServletResponse) servletResponse).setStatus(500);
        };

        filter.doFilter(request, response, chain);

        verify(recorder, never()).recordResponse(request, response, 0L);
    }

    @FunctionalInterface
    private interface TestFilterChain extends jakarta.servlet.FilterChain {
        @Override
        void doFilter(ServletRequest request, ServletResponse response) throws IOException, ServletException;
    }
}
