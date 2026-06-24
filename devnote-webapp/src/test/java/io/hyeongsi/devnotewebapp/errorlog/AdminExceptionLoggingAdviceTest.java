package io.hyeongsi.devnotewebapp.errorlog;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class AdminExceptionLoggingAdviceTest {

    private final ErrorLogRecorder recorder = mock(ErrorLogRecorder.class);
    private final AdminExceptionLoggingAdvice advice = new AdminExceptionLoggingAdvice(recorder);

    @Test
    void recordsUnexpectedExceptionsAsServerErrors() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/dashboard/stats");
        RuntimeException exception = new IllegalStateException("database down");

        ResponseEntity<ErrorLogDtos.ErrorResponse> response = advice.handleUnexpectedException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().message()).isEqualTo("서버 오류가 발생했습니다.");
        verify(recorder).recordException(request, 500, exception, 0L);
    }

    @Test
    void doesNotRecordClientErrors() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/error-logs/404");
        ResponseStatusException exception = new ResponseStatusException(HttpStatus.NOT_FOUND, "Error log not found");

        ResponseEntity<ErrorLogDtos.ErrorResponse> response = advice.handleResponseStatusException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(recorder, never()).recordException(request, 404, exception, 0L);
    }

    @Test
    void recordsResponseStatusServerErrors() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/error-logs");
        ResponseStatusException exception = new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "maintenance");

        ResponseEntity<ErrorLogDtos.ErrorResponse> response = advice.handleResponseStatusException(exception, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        verify(recorder).recordException(request, 503, exception, 0L);
    }
}
