package com.app.loveecho.dto;

import java.time.LocalDateTime;

import com.app.loveecho.jpa.entity.FollowStatus;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowResponseDTO {

    private Long id; // followRelationId
    private FollowUserDTO user; // follower OR following
    private FollowStatus status;
    private LocalDateTime requestedAt;
}
