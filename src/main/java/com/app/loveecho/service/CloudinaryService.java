package com.app.loveecho.service;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;

@Service
public class CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    // 📤 Upload image
    public Map<String, String> uploadImage(MultipartFile file) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                Map.of("folder", "loveecho/profile-pictures")
            );

            return Map.of(
                "url", result.get("secure_url").toString(),
                "publicId", result.get("public_id").toString()
            );

        } catch (Exception e) {
            throw new RuntimeException("Image upload failed");
        }
    }

    // 🗑️ Delete image
    public void deleteImage(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, Map.of());
        } catch (Exception e) {
            // log only, don't break flow
            System.err.println("Failed to delete image: " + publicId);
        }
    }
    public Map uploadBase64(String base64) {
        try {
            return cloudinary.uploader().upload(base64, Map.of());
        } catch (Exception e) {
            throw new RuntimeException("Cloudinary upload failed", e);
        }
    }

}
