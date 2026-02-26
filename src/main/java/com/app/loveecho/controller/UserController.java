package com.app.loveecho.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.app.loveecho.dto.BioRequestDTO;
import com.app.loveecho.dto.LoginRequest;
import com.app.loveecho.dto.UpdateProfileRequest;
import com.app.loveecho.dto.UserResponseDTO;
import com.app.loveecho.jpa.entity.User;
import com.app.loveecho.jpa.repository.UserRepository;
import com.app.loveecho.security.JwtUtil;
import com.app.loveecho.service.CloudinaryService;
import com.app.loveecho.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private UserRepository userRepository;

    // =======================
    // ✅ REGISTER
    // =======================
//     @PostMapping("/register")
// public ResponseEntity<?> registerUser(@RequestBody User user) {
//     try {
//         User savedUser = userService.registerUser(user);
//         return ResponseEntity.ok(mapToDTO(savedUser));

//     } catch (RuntimeException e) {
//         return ResponseEntity
//                 .badRequest()
//                 .body(Map.of("error", e.getMessage()));

//     } catch (Exception e) {
//         e.printStackTrace();
//         return ResponseEntity
//                 .internalServerError()
//                 .body(Map.of("error", "Server error: " + e.getMessage()));
//     }
// }

@PostMapping("/register")
public ResponseEntity<?> registerUser(@RequestBody User user) {
    try {
        // 1️⃣ Save user (password already encoded inside service)
        User savedUser = userService.registerUser(user);

        // 2️⃣ Directly generate token (no re-authentication)
        String token = jwtUtil.generateToken(savedUser);

        // 3️⃣ Return token + user
        return ResponseEntity.ok(
                Map.of(
                        "token", token,
                        "user", mapToDTO(savedUser)
                )
        );

    } catch (RuntimeException e) {
        return ResponseEntity
                .badRequest()
                .body(Map.of("error", e.getMessage()));

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity
                .internalServerError()
                .body(Map.of("error", "Server error: " + e.getMessage()));
    }
}

    // =======================
    // 🔓 PUBLIC PROFILE
    // =======================
    @GetMapping("/{username}")
    public ResponseEntity<UserResponseDTO> getUserByUsername(
            @PathVariable String username
    ) {
        return userService.findByUsername(username)
                .map(user -> ResponseEntity.ok(mapToDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // =======================
    // 🔐 LOGIN (username OR email)
    // =======================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService
                    .findByUsernameOrEmail(request.getUsernameOrEmail())
                    .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            request.getPassword() // ✅ RAW password
                    )
            );

            String token = jwtUtil.generateToken(user);

            return ResponseEntity.ok(
                    Map.of(
                            "token", token,
                            "username", user.getUsername()
                    )
            );

        } catch (BadCredentialsException e) {
            return ResponseEntity
                    .status(401)
                    .body(Map.of("error", "Invalid username/email or password"));
        }
    }

    // =======================
    // 🔐 GET CURRENT USER
    // =======================
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {

        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        UserDetails userDetails = (UserDetails) auth.getPrincipal();

        User user = userService.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(mapToDTO(user));
    }

    // =======================
    // ✏️ UPDATE PROFILE
    // =======================
    @PutMapping("/me")
    public ResponseEntity<UserResponseDTO> updateProfile(
            @RequestBody UpdateProfileRequest request
    ) {
        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        UserDetails userDetails = (UserDetails) auth.getPrincipal();

        User user = userService.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        User updatedUser = userService.updateProfile(user, request);

        return ResponseEntity.ok(mapToDTO(updatedUser));
    }

    // =======================
    // 📸 UPLOAD PROFILE PICTURE
    // =======================
    @PostMapping("/me/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(
            @RequestParam("file") MultipartFile file
    ) {
        System.out.println("PROFILE PICTURE ENDPOINT HIT");
        Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();

        UserDetails userDetails = (UserDetails) auth.getPrincipal();

        User user = userService.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        User updatedUser = userService.updateProfilePicture(user, file);

        return ResponseEntity.ok(
                Map.of("profileImageUrl", updatedUser.getProfileImageUrl())
        );
    }

    // =======================
    // 🗑️ DELETE PROFILE PICTURE
    // =======================
    @DeleteMapping("/me/profile-picture")
        public ResponseEntity<?> deleteProfilePicture(Authentication authentication) {

        if (authentication == null) {
                return ResponseEntity.status(401).build();
        }

        String username = authentication.getName();

        User user = userService.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getProfileImagePublicId() != null) {
                try {
                cloudinaryService.deleteImage(user.getProfileImagePublicId());
                } catch (Exception e) {
                System.err.println("Cloudinary delete failed: " + e.getMessage());
                }

                user.setProfileImageUrl(null);
                user.setProfileImagePublicId(null);
                userRepository.save(user);
        }

        return ResponseEntity.ok(
                Map.of("message", "Profile picture removed")
        );
        }

    // =======================
    // 🔁 MAPPER
    // =======================
    private UserResponseDTO mapToDTO(User user) {
        return UserResponseDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .bio(user.getBio())
                .build();
    }

    @PostMapping("/me/fcm-token")
    public ResponseEntity<Void> savePushToken(
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        String token = body.get("token");
        String username = authentication.getName();

        userService.savePushToken(username, token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/me/profile-picture-base64")
public ResponseEntity<?> uploadProfilePictureBase64(@RequestBody Map<String, String> body) {

    String image = body.get("image");

    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    UserDetails userDetails = (UserDetails) auth.getPrincipal();

    User user = userService.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

    User updatedUser = userService.updateProfilePictureBase64(user, image);

    return ResponseEntity.ok(
        Map.of("profileImageUrl", updatedUser.getProfileImageUrl())
    );
}

@PutMapping("/bio")
public ResponseEntity<?> updateBio(
        @RequestBody BioRequestDTO request,
        Authentication authentication
) {
    if (authentication == null) {
        return ResponseEntity.status(401).build();
    }

    UserDetails userDetails =
            (UserDetails) authentication.getPrincipal();

    User user = userService.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

    User updatedUser = userService.updateBio(
            user.getId(),
            request.getBio()
    );

    return ResponseEntity.ok(
            Map.of(
                    "message", "Bio updated successfully",
                    "bio", updatedUser.getBio()
            )
    );
}

@PutMapping("/me/privacy")
public ResponseEntity<?> updatePrivacy(
        @RequestBody Map<String, Boolean> body,
        Authentication authentication
) {
    UserDetails userDetails =
            (UserDetails) authentication.getPrincipal();

    User user = userService.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));

    user.setPrivate(body.get("isPrivate"));
    userRepository.save(user);

    return ResponseEntity.ok(
            Map.of("isPrivate", user.isPrivate())
    );
}


}
