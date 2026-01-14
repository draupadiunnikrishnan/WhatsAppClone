package com.whatsappclone.service;

import com.whatsappclone.domain.User;
import com.whatsappclone.repository.UserRepository;
import com.whatsappclone.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public String register(String name, String email, String password) {
        String normalizedEmail = email.toLowerCase();
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new RuntimeException("User already exists");
        }
        User user = new User();
        user.setName(name);
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(password));
        User savedUser = userRepository.save(user);
        return jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId());
    }

    public String login(String email, String password) {
        String normalizedEmail = email.toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        return jwtUtil.generateToken(user.getEmail(), user.getId());
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
