package com.northbridge.backend.config;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleOAuth2FailureHandler implements AuthenticationFailureHandler {

    @Value("${app.frontend.oauth-callback-url:http://localhost:5173/oauth/callback}")
    private String frontendCallbackUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            message = "Google login failed. Please check OAuth client settings.";
        }

        String url = UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                .queryParam("success", "false")
                .queryParam("message", message)
                .build()
                .encode()
                .toUriString();

        response.sendRedirect(url);
    }
}
