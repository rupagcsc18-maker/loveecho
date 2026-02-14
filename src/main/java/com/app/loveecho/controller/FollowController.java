package com.app.loveecho.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.app.loveecho.dto.FollowActionResponseDTO;
import com.app.loveecho.dto.FollowResponseDTO;
import com.app.loveecho.mapper.FollowMapper;
import com.app.loveecho.jpa.entity.FollowRelation;
import com.app.loveecho.service.FollowService;
import com.app.loveecho.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;
    private final UserService userService;

    public FollowController() {
        this.followService = null;
        this.userService = null;
    }

    // =========================
    // ➕ FOLLOW / REQUEST
    // =========================
    @PostMapping("/{userId}")
    public ResponseEntity<FollowActionResponseDTO> followUser(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        Long currentUserId =
                userService.getUserIdByUsername(userDetails.getUsername());

        FollowRelation relation =
                followService.followUser(currentUserId, userId);

        return ResponseEntity.ok(
                FollowActionResponseDTO.builder()
                        .status(relation.getStatus())
                        .message(
                                relation.getStatus().name().equals("PENDING")
                                        ? "Follow request sent"
                                        : "Now following"
                        )
                        .build()
        );
    }

    // =========================
    // ✅ ACCEPT REQUEST
    // =========================
    @PostMapping("/accept/{userId}")
    public ResponseEntity<FollowActionResponseDTO> acceptFollowRequest(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        Long currentUserId =
                userService.getUserIdByUsername(userDetails.getUsername());

        followService.acceptFollowRequest(currentUserId, userId);

        return ResponseEntity.ok(
                FollowActionResponseDTO.builder()
                        .message("Follow request accepted")
                        .status(null)
                        .build()
        );
    }

    // =========================
    // ❌ REJECT REQUEST
    // =========================
    @PostMapping("/reject/{userId}")
    public ResponseEntity<FollowActionResponseDTO> rejectFollowRequest(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        Long currentUserId =
                userService.getUserIdByUsername(userDetails.getUsername());

        followService.rejectFollowRequest(currentUserId, userId);

        return ResponseEntity.ok(
                FollowActionResponseDTO.builder()
                        .message("Follow request rejected")
                        .status(null)
                        .build()
        );
    }

    // =========================
    // 🔄 CANCEL SENT REQUEST
    // =========================
    @DeleteMapping("/cancel/{userId}")
    public ResponseEntity<FollowActionResponseDTO> cancelFollowRequest(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        Long currentUserId =
                userService.getUserIdByUsername(userDetails.getUsername());

        followService.cancelFollowRequest(currentUserId, userId);

        return ResponseEntity.ok(
                FollowActionResponseDTO.builder()
                        .message("Follow request cancelled")
                        .status(null)
                        .build()
        );
    }

    // =========================
    // 🚫 UNFOLLOW
    // =========================
    @DeleteMapping("/{userId}")
    public ResponseEntity<FollowActionResponseDTO> unfollowUser(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        Long currentUserId =
                userService.getUserIdByUsername(userDetails.getUsername());

        followService.unfollowUser(currentUserId, userId);

        return ResponseEntity.ok(
                FollowActionResponseDTO.builder()
                        .message("Unfollowed successfully")
                        .status(null)
                        .build()
        );
    }

    // =========================
    // 📥 PENDING REQUESTS
    // =========================
    @GetMapping("/requests")
    public ResponseEntity<List<FollowResponseDTO>> getPendingRequests(
            Authentication authentication
    ) {
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();

        Long currentUserId =
                userService.getUserIdByUsername(userDetails.getUsername());

        return ResponseEntity.ok(
                followService.getPendingRequests(currentUserId)
                        .stream()
                        .map(r -> FollowMapper.toResponseDTO(r, currentUserId))
                        .toList()
        );
    }

    // =========================
    // 👥 FOLLOWERS
    // =========================
    @GetMapping("/followers/{userId}")
    public ResponseEntity<List<FollowResponseDTO>> getFollowers(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                followService.getFollowers(userId)
                        .stream()
                        .map(r -> FollowMapper.toResponseDTO(r, userId))
                        .toList()
        );
    }

    // =========================
    // 👣 FOLLOWING
    // =========================
    @GetMapping("/following/{userId}")
    public ResponseEntity<List<FollowResponseDTO>> getFollowing(
            @PathVariable Long userId
    ) {
        return ResponseEntity.ok(
                followService.getFollowing(userId)
                        .stream()
                        .map(r -> FollowMapper.toResponseDTO(r, userId))
                        .toList()
        );
    }
}
