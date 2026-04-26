package com.northbridge.backend.config;

import java.io.IOException;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import com.northbridge.backend.model.Student;
import com.northbridge.backend.model.User;
import com.northbridge.backend.repository.StudentRepository;
import com.northbridge.backend.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class GoogleOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    @Value("${app.frontend.oauth-callback-url:http://localhost:5173/oauth/callback}")
    private String frontendCallbackUrl;

    public GoogleOAuth2SuccessHandler(StudentRepository studentRepository, UserRepository userRepository) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        if (!(authentication instanceof OAuth2AuthenticationToken token)) {
            redirectFailure(response, "Unsupported Google login response.");
            return;
        }

        Map<String, Object> attributes = token.getPrincipal().getAttributes();
        String email = value(attributes.get("email")).trim();

        if (email.isBlank()) {
            redirectFailure(response, "Google account did not provide an email.");
            return;
        }

        String normalizedEmail = email.toLowerCase(Locale.ROOT);

        Optional<Student> student = studentRepository.findByEmailCaseInsensitive(normalizedEmail);
        if (student.isPresent()) {
            redirectStudent(response, student.get());
            return;
        }

        Optional<User> user = userRepository.findByEmailCaseInsensitive(normalizedEmail);
        if (user.isPresent()) {
            redirectUser(response, user.get());
            return;
        }

        redirectFailure(response, "Your Google email is not registered. Please contact admin.");
    }

    private void redirectStudent(HttpServletResponse response, Student student) throws IOException {
        if (!student.isActive() || !"ACTIVE".equalsIgnoreCase(value(student.getStatus()))) {
            redirectFailure(response, "Your student account is inactive. Please contact admin.");
            return;
        }

        String url = UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                .queryParam("success", "true")
                .queryParam("role", "STUDENT")
                .queryParam("id", student.getId())
                .queryParam("studentId", student.getStudentId())
                .queryParam("name", student.getName())
                .queryParam("email", student.getEmail())
                .queryParam("profileImageUrl", value(student.getProfileImageUrl()))
                .build()
                .encode()
                .toUriString();

        response.sendRedirect(url);
    }

    private void redirectUser(HttpServletResponse response, User user) throws IOException {
        if (!user.isActive()) {
            redirectFailure(response, "Your account is inactive. Please contact admin.");
            return;
        }

        String url = UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                .queryParam("success", "true")
                .queryParam("role", user.getRole())
                .queryParam("id", user.getId())
                .queryParam("name", user.getName())
                .queryParam("email", user.getEmail())
                .queryParam("profileImageUrl", value(user.getProfileImageUrl()))
                .build()
                .encode()
                .toUriString();

        response.sendRedirect(url);
    }

    private void redirectFailure(HttpServletResponse response, String message) throws IOException {
        String url = UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                .queryParam("success", "false")
                .queryParam("message", message)
                .build()
                .encode()
                .toUriString();

        response.sendRedirect(url);
    }

    private String value(Object value) {
        return value == null ? "" : value.toString();
    }
}
