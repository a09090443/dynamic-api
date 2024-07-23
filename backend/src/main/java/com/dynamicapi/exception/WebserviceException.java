package com.dynamicapi.exception;

public class WebserviceException extends RuntimeException {
    public WebserviceException(String message) {
        super(message);
    }

    public WebserviceException(String message, Throwable cause) {
        super(message, cause);
    }
}
