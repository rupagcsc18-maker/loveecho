package com.app.loveecho.jpa.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.app.loveecho.jpa.entity.RefreshToken;

public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    void deleteByUserId(Long userId);
}