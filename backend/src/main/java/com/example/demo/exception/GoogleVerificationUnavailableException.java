package com.example.demo.exception;

public class GoogleVerificationUnavailableException extends RuntimeException {
    public GoogleVerificationUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
