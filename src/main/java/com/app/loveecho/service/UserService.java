package com.app.loveecho.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.app.loveecho.dto.UpdateProfileRequest;
import com.app.loveecho.jpa.entity.User;
import com.app.loveecho.jpa.repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CloudinaryService cloudinaryService;

    // Register a new user
    public User registerUser(User user) {

        if (userRepository.existsByUsername(user.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        if (user.getRole() == null) {
        user.setRole("USER"); 
    }

        // Hash password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Find user by username
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    // Find user by ID
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByUsernameOrEmail(String value) {
        return userRepository.findByUsernameOrEmail(value, value);
    }

    public User updateProfile(User user, UpdateProfileRequest request) {

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return userRepository.save(user);
    }

    public User updateProfilePicture(User user, MultipartFile file) {

        // 🔥 Delete old image if exists
        if (user.getProfileImagePublicId() != null) {
            cloudinaryService.deleteImage(user.getProfileImagePublicId());
        }

        // 📤 Upload new image
        var uploadResult = cloudinaryService.uploadImage(file);

        user.setProfileImageUrl(uploadResult.get("url"));
        user.setProfileImagePublicId(uploadResult.get("publicId"));

        return userRepository.save(user);
    }

    public void savePushToken(String username, String token) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPushToken(token);
        userRepository.save(user);
    }

 public User updateProfilePictureBase64(User user, String base64Image) {

    if (user.getProfileImagePublicId() != null) {
        cloudinaryService.deleteImage(user.getProfileImagePublicId());
    }

    var uploadResult = cloudinaryService.uploadBase64(base64Image);

    user.setProfileImageUrl(uploadResult.get("url").toString());
    user.setProfileImagePublicId(uploadResult.get("publicId").toString());

    return userRepository.save(user);
}

public User updateBio(Long userId, String bio) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBio(bio);
        return userRepository.save(user);
    }

public Long getUserIdByUsername(String username) {
    return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"))
            .getId();
}

    



}
