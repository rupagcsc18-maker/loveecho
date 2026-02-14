package com.app.loveecho.mapper;

import com.app.loveecho.dto.FollowResponseDTO;
import com.app.loveecho.dto.FollowUserDTO;
import com.app.loveecho.jpa.entity.FollowRelation;
import com.app.loveecho.jpa.entity.User;

public class FollowMapper {

    public static FollowUserDTO toUserDTO(User user) {
        return FollowUserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .profileImageUrl(user.getProfileImageUrl())
                .bio(user.getBio())
                .build();
    }

    /**
     * currentUserId is needed to decide
     * whether to show follower or following
     */
    public static FollowResponseDTO toResponseDTO(
            FollowRelation relation,
            Long currentUserId
    ) {
        User otherUser =
                relation.getFollower().getId().equals(currentUserId)
                        ? relation.getFollowing()
                        : relation.getFollower();

        return FollowResponseDTO.builder()
                .id(relation.getId())
                .user(toUserDTO(otherUser))
                .status(relation.getStatus())
                .requestedAt(relation.getCreatedAt())
                .build();
    }
}
