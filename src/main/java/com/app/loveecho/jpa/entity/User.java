package com.app.loveecho.jpa.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password; // store hashed passwords

    @Column(nullable = false)
    private String role = "USER"; // could be USER, ADMIN

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "profile_image_public_id")
    private String profileImagePublicId;

    @Column(name = "push_token")
    private String pushToken;

    @Column(length = 500)
    private String bio;

    @Column(name = "is_private")
private Boolean isPrivate = false;

public Boolean isPrivate() {
    return Boolean.TRUE.equals(this.isPrivate);
}

public void setPrivate(Boolean aPrivate) {
    this.isPrivate = aPrivate;
}

}
