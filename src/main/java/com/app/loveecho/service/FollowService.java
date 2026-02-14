package com.app.loveecho.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.loveecho.jpa.entity.FollowRelation;
import com.app.loveecho.jpa.entity.FollowStatus;
import com.app.loveecho.jpa.entity.User;
import com.app.loveecho.jpa.repository.FollowRepository;
import com.app.loveecho.jpa.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    // =========================
    // ➕ FOLLOW / REQUEST
    // =========================
    @Transactional
    public FollowRelation followUser(Long followerId, Long followingId) {

        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("You cannot follow yourself");
        }

        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new RuntimeException("Follower not found"));

        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        followRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .ifPresent(r -> {
                    throw new RuntimeException("Follow relation already exists");
                });

        FollowStatus status =
                following.isPrivate()
                        ? FollowStatus.PENDING
                        : FollowStatus.ACCEPTED;

        FollowRelation relation = FollowRelation.builder()
                .follower(follower)
                .following(following)
                .status(status)
                .createdAt(LocalDateTime.now())
                .build();

        return followRepository.save(relation);
    }

    // =========================
    // ✅ ACCEPT REQUEST
    // =========================
    @Transactional
    public void acceptFollowRequest(Long currentUserId, Long requesterId) {

        FollowRelation relation =
                followRepository
                        .findByFollowerIdAndFollowingIdAndStatus(
                                requesterId,
                                currentUserId,
                                FollowStatus.PENDING
                        )
                        .orElseThrow(() ->
                                new RuntimeException("No pending request found"));

        relation.setStatus(FollowStatus.ACCEPTED);
        followRepository.save(relation);
    }

    // =========================
    // ❌ REJECT REQUEST
    // =========================
    @Transactional
    public void rejectFollowRequest(Long currentUserId, Long requesterId) {

        FollowRelation relation =
                followRepository
                        .findByFollowerIdAndFollowingIdAndStatus(
                                requesterId,
                                currentUserId,
                                FollowStatus.PENDING
                        )
                        .orElseThrow(() ->
                                new RuntimeException("No pending request found"));

        relation.setStatus(FollowStatus.REJECTED);
        followRepository.save(relation);
    }

    // =========================
    // 🔄 CANCEL SENT REQUEST
    // =========================
    @Transactional
    public void cancelFollowRequest(Long followerId, Long followingId) {

        FollowRelation relation =
                followRepository
                        .findByFollowerIdAndFollowingIdAndStatus(
                                followerId,
                                followingId,
                                FollowStatus.PENDING
                        )
                        .orElseThrow(() ->
                                new RuntimeException("No pending request to cancel"));

        followRepository.delete(relation);
    }

    // =========================
    // 🚫 UNFOLLOW
    // =========================
    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {

        FollowRelation relation =
                followRepository
                        .findByFollowerIdAndFollowingIdAndStatus(
                                followerId,
                                followingId,
                                FollowStatus.ACCEPTED
                        )
                        .orElseThrow(() ->
                                new RuntimeException("You are not following this user"));

        followRepository.delete(relation);
    }

    // =========================
    // 📥 PENDING REQUESTS
    // =========================
    public List<FollowRelation> getPendingRequests(Long userId) {
        return followRepository.findByFollowingIdAndStatus(
                userId,
                FollowStatus.PENDING
        );
    }

    // =========================
    // 👥 FOLLOWERS
    // =========================
    public List<FollowRelation> getFollowers(Long userId) {
        return followRepository.findByFollowingIdAndStatusOrderByCreatedAtDesc(
                userId,
                FollowStatus.ACCEPTED
        );
    }

    // =========================
    // 👣 FOLLOWING
    // =========================
    public List<FollowRelation> getFollowing(Long userId) {
        return followRepository.findByFollowerIdAndStatusOrderByCreatedAtDesc(
                userId,
                FollowStatus.ACCEPTED
        );
    }

    // =========================
    // 🔐 PRIVACY CHECK
    // =========================
    public boolean canViewProfile(Long viewerId, Long profileOwnerId) {

        User owner = userRepository.findById(profileOwnerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!owner.isPrivate()) {
            return true;
        }

        return followRepository.existsByFollowerIdAndFollowingIdAndStatus(
                viewerId,
                profileOwnerId,
                FollowStatus.ACCEPTED
        );
    }
}
