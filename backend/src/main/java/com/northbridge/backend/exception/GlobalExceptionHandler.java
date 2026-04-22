package com.northbridge.backend.exception;

import com.northbridge.backend.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));

        return ResponseEntity.badRequest().body(new ApiResponse(false, message));
    }

    @ExceptionHandler(BookingConflictException.class)
    public ResponseEntity<ApiResponse> handleConflict(BookingConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiResponse> handleNotFound(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse> handleForbidden(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new ApiResponse(false, ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponse(false, "Unexpected server error: " + ex.getMessage()));
    }
}
