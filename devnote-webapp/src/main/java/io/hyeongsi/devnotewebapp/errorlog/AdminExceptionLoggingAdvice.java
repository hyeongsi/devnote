package io.hyeongsi.devnotewebapp.errorlog;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class AdminExceptionLoggingAdvice {

    private static final String GENERIC_SERVER_ERROR_MESSAGE = "서버 오류가 발생했습니다.";

    private final ErrorLogRecorder recorder;

    public AdminExceptionLoggingAdvice(ErrorLogRecorder recorder) {
        this.recorder = recorder;
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorLogDtos.ErrorResponse> handleResponseStatusException(
            ResponseStatusException exception,
            HttpServletRequest request
    ) {
        HttpStatusCode statusCode = exception.getStatusCode();
        if (statusCode.is5xxServerError()) {
            recorder.recordException(request, statusCode.value(), exception, 0L);
        }
        return ResponseEntity
                .status(statusCode)
                .body(new ErrorLogDtos.ErrorResponse(messageFor(statusCode, exception.getReason())));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorLogDtos.ErrorResponse> handleNoResourceFoundException(
            NoResourceFoundException exception
    ) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(new ErrorLogDtos.ErrorResponse("요청한 리소스를 찾을 수 없습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorLogDtos.ErrorResponse> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {
        recorder.recordException(request, HttpStatus.INTERNAL_SERVER_ERROR.value(), exception, 0L);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorLogDtos.ErrorResponse(GENERIC_SERVER_ERROR_MESSAGE));
    }

    private String messageFor(HttpStatusCode statusCode, String reason) {
        if (statusCode.is5xxServerError()) {
            return GENERIC_SERVER_ERROR_MESSAGE;
        }
        return reason == null || reason.isBlank() ? "요청을 처리할 수 없습니다." : reason;
    }
}
