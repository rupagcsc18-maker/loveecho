package com.app.loveecho.jpa.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.app.loveecho.jpa.entity.FollowRelation;
import com.app.loveecho.jpa.entity.FollowStatus;

@Repository
public interface FollowRepository extends JpaRepository<FollowRelation, Long> {

    // =========================
    // 🔍 BASIC LOOKUPS
    // =========================

    Optional<FollowRelation> findByFollowerIdAndFollowingId(
            Long followerId,
            Long followingId
    );

    Optional<FollowRelation> findByFollowerIdAndFollowingIdAndStatus(
            Long followerId,
            Long followingId,
            FollowStatus status
    );

    boolean existsByFollowerIdAndFollowingIdAndStatus(
            Long followerId,
            Long followingId,
            FollowStatus status
    );

    // =========================
    // 📥 FOLLOW REQUESTS
    // =========================

    // Requests RECEIVED by a user
    List<FollowRelation> findByFollowingIdAndStatus(
            Long followingId,
            FollowStatus status
    );

    // Requests SENT by a user
    List<FollowRelation> findByFollowerIdAndStatus(
            Long followerId,
            FollowStatus status
    );

    // =========================
    // 👥 FOLLOWERS / FOLLOWING
    // =========================

    // Who follows THIS user
    List<FollowRelation> findByFollowingIdAndStatusOrderByCreatedAtDesc(
            Long followingId,
            FollowStatus status
    );

    // Who THIS user follows
    List<FollowRelation> findByFollowerIdAndStatusOrderByCreatedAtDesc(
            Long followerId,
            FollowStatus status
    );

    // =========================
    // ❌ DELETE / CANCEL
    // =========================

    void deleteByFollowerIdAndFollowingIdAndStatus(
            Long followerId,
            Long followingId,
            FollowStatus status
    );

    void deleteByFollowerIdAndFollowingId(
            Long followerId,
            Long followingId
    );

    // =========================
    // 🔐 PRIVACY CHECK
    // =========================

    boolean existsByFollowerIdAndFollowingId(
            Long followerId,
            Long followingId
    );
}
