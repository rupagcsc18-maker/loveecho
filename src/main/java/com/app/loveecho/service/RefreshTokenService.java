package com.app.loveecho.service;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.loveecho.jpa.entity.RefreshToken;
import com.app.loveecho.jpa.entity.User;
import com.app.loveecho.jpa.repository.RefreshTokenRepository;

@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository repository;

    private final long refreshTokenDurationMs = 7 * 24 * 60 * 60 * 1000; // 7 days

    public RefreshToken createRefreshToken(User user) {

        repository.deleteByUserId(user.getId()); // one token per user

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now()
                        .plusMillis(refreshTokenDurationMs))
                .build();

        return repository.save(token);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {

        if (token.getExpiryDate().isBefore(Instant.now())) {
            repository.delete(token);
            throw new RuntimeException("Refresh token expired");
        }

        return token;
    }

    public RefreshToken findByToken(String token) {
    return repository.findByToken(token)
            .orElseThrow(() ->
                new RuntimeException("Refresh token not found"));
}
}