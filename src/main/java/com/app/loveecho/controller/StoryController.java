package com.app.loveecho.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;



import com.app.loveecho.dto.CommentResponseDTO;
import com.app.loveecho.dto.EditStoryRequest;
import com.app.loveecho.dto.StoryResponseDTO;
import com.app.loveecho.mongo.document.Story;
import com.app.loveecho.service.CloudinaryService;
import com.app.loveecho.service.StoryService;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    private final CloudinaryService cloudinaryService;


    /* =========================
       CREATE STORY
    ========================== */
  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<StoryResponseDTO> createStory(
        @RequestPart("story") String storyJson,
        @RequestPart(value = "images", required = false) List<MultipartFile> images,
        Authentication authentication
) throws Exception {

    if (authentication == null) {
        return ResponseEntity.status(401).build();
    }

    ObjectMapper mapper = new ObjectMapper();
    Story story = mapper.readValue(storyJson, Story.class);

    return ResponseEntity.ok(
            storyService.createStory(story, authentication.getName(), images)
    );
}

    /* =========================
       GET PUBLIC STORIES
    ========================== */
    @GetMapping
    public ResponseEntity<List<StoryResponseDTO>> getPublicStories() {
        return ResponseEntity.ok(
                storyService.getAllPublicStories()
        );
    }

    /* =========================
       GET USER STORIES
    ========================== */
    @GetMapping("/user/{username}")
    public ResponseEntity<List<StoryResponseDTO>> getUserStories(
            @PathVariable String username
    ) {
        return ResponseEntity.ok(
                storyService.getStoriesByUser(username)
        );
    }

    /* =========================
       HASHTAG STORIES
    ========================== */
    @GetMapping("/hashtag/{tag}")
    public ResponseEntity<List<StoryResponseDTO>> getStoriesByHashtag(
            @PathVariable String tag
    ) {
        return ResponseEntity.ok(
                storyService.getStoriesByHashtag(tag)
        );
    }

    /* =========================
       ADD COMMENT (🔔 Notification triggered in service)
    ========================== */
    @PostMapping("/{storyId}/comments")
    public ResponseEntity<StoryResponseDTO> addComment(
            @PathVariable String storyId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        if (body == null || !body.containsKey("text") || body.get("text").isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                storyService.addComment(
                        storyId,
                        body.get("text"),
                        authentication.getName()
                )
        );
    }

    /* =========================
       REACT TO STORY (🔔 Notification triggered in service)
    ========================== */
    @PostMapping("/{storyId}/reactions")
    public ResponseEntity<StoryResponseDTO> reactToStory(
            @PathVariable String storyId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        String type = body.getOrDefault("type", "LIKE").toUpperCase();

        return ResponseEntity.ok(
                storyService.reactToStory(
                        storyId,
                        type,
                        authentication.getName()
                )
        );
    }

    /* =========================
       PAGED PUBLIC STORIES
    ========================== */
    @GetMapping("/paged")
    public ResponseEntity<Page<StoryResponseDTO>> getPagedStories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ResponseEntity.ok(
                storyService.getPagedPublicStories(pageable)
        );
    }

    /* =========================
       PAGED COMMENTS
    ========================== */
    @GetMapping("/{storyId}/comments/paged")
    public ResponseEntity<Page<CommentResponseDTO>> getCommentsPaged(
            @PathVariable String storyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ResponseEntity.ok(
                storyService.getPagedComments(storyId, pageable)
        );
    }

    /* =========================
       MY PRIVATE STORIES
    ========================== */
    @GetMapping("/my/private")
    public ResponseEntity<List<StoryResponseDTO>> getMyPrivateStories(
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(
                storyService.getMyPrivateStories(authentication.getName())
        );
    }

    /* =========================
       GET STORY BY ID
    ========================== */
    @GetMapping("/{id}")
    public ResponseEntity<StoryResponseDTO> getStoryById(
            @PathVariable String id,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                storyService.getStoryById(id, authentication)
        );
    }

    /* =========================
       EDIT STORY
    ========================== */
    @PutMapping("/{id}")
public ResponseEntity<StoryResponseDTO> editStory(
        @PathVariable String id,
        @RequestBody EditStoryRequest body,   // ✅ DTO
        Authentication authentication
) {
    if (authentication == null) {
        return ResponseEntity.status(401).build();
    }

    return ResponseEntity.ok(
            storyService.editStory(
                    id,
                    body,                        // ✅ DTO passed
                    authentication.getName()
            )
    );
}

    /* =========================
       DELETE STORY
    ========================== */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStory(
            @PathVariable String id,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        storyService.deleteStory(id, authentication.getName());

        return ResponseEntity.ok(
                Map.of("message", "Story deleted")
        );
    }

    /* =========================
       TOGGLE VISIBILITY
    ========================== */
    @PatchMapping("/{id}/visibility")
    public ResponseEntity<StoryResponseDTO> toggleVisibility(
            @PathVariable String id,
            Authentication authentication
    ) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(
                storyService.toggleVisibility(
                        id,
                        authentication.getName()
                )
        );
    }

    /* =========================
       CATEGORY FILTER
    ========================== */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<StoryResponseDTO>> getStoriesByCategory(
            @PathVariable String category
    ) {
        return ResponseEntity.ok(
                storyService.getStoriesByCategory(category)
        );
    }

    /* =========================
       SEARCH STORIES
    ========================== */
    @GetMapping("/search")
    public ResponseEntity<Page<StoryResponseDTO>> searchStories(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        return ResponseEntity.ok(
                storyService.searchStories(q, pageable)
        );
    }
    @GetMapping("/my/public")
        public ResponseEntity<List<StoryResponseDTO>> getMyPublicStories(
                        Authentication authentication
                ) {
                if (authentication == null) {
                        return ResponseEntity.status(401).build();
                }

                return ResponseEntity.ok(
                        storyService.getStoriesByUser(authentication.getName())
                );
        }

        @DeleteMapping("/{storyId}/comments/{commentId}")
public ResponseEntity<StoryResponseDTO> deleteComment(
        @PathVariable String storyId,
        @PathVariable String commentId,
        Authentication authentication
) {
    if (authentication == null) {
        return ResponseEntity.status(401).build();
    }

    return ResponseEntity.ok(
            storyService.deleteComment(
                    storyId,
                    commentId,
                    authentication.getName()
            )
    );
}

@GetMapping("/most-liked")
public ResponseEntity<List<StoryResponseDTO>> mostLiked() {
    return ResponseEntity.ok(storyService.getMostLikedStories());
}

@GetMapping("/trending")
public ResponseEntity<List<StoryResponseDTO>> trending() {
    return ResponseEntity.ok(storyService.getTrendingStories());
}

@GetMapping("/feed")
public ResponseEntity<List<StoryResponseDTO>> personalizedFeed(
        Authentication authentication
) {
    if (authentication == null) {
        return ResponseEntity.ok(
            storyService.getAllPublicStories() // fallback
        );
    }

    return ResponseEntity.ok(
        storyService.getPersonalizedFeed(authentication.getName())
    );
}



}
