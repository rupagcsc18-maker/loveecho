package com.app.loveecho.dto;

import com.app.loveecho.jpa.entity.FollowStatus;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowActionResponseDTO {

    private String message;
    private FollowStatus status;
}
