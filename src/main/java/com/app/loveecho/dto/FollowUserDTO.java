package com.app.loveecho.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUserDTO {

    private Long id;
    private String username;
    private String profileImageUrl;
    private String bio;
}
