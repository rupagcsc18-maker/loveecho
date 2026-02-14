package com.app.loveecho.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.app.loveecho.dto.CommentResponseDTO;
import com.app.loveecho.dto.EditStoryRequest;
import com.app.loveecho.dto.StoryResponseDTO;
import com.app.loveecho.dto.UserMiniDTO;
import com.app.loveecho.exception.ResourceNotFoundException;
import com.app.loveecho.jpa.entity.NotificationType;
import com.app.loveecho.jpa.entity.StoryCategory;
import com.app.loveecho.jpa.entity.User;
import com.app.loveecho.jpa.entity.Visibility;
import com.app.loveecho.jpa.repository.UserRepository;
import com.app.loveecho.mongo.document.Comment;
import com.app.loveecho.mongo.document.Reaction;
import com.app.loveecho.mongo.document.Story;
import com.app.loveecho.mongo.document.UserPreference;
import com.app.loveecho.mongo.repository.StoryRepository;
import com.app.loveecho.service.CloudinaryService;
import com.app.loveecho.service.UserPreferenceService;


import lombok.RequiredArgsConstructor;



@Service
@RequiredArgsConstructor
public class StoryService {

    private final StoryRepository storyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CloudinaryService cloudinaryService;
    private final UserPreferenceService preferenceService;


   

    /* =========================
       CREATE STORY
    ========================== */
   public StoryResponseDTO createStory(
        Story story,
        String username,
        List<MultipartFile> images
) {
    story.setUserId(username);

    if (story.getAnonymous() == null) {
        story.setAnonymous(false);
    }

    if (story.getCategory() == null) {
        story.setCategory(StoryCategory.GENERAL);
    }

    if (story.getVisibility() == null) {
        story.setVisibility(Visibility.PUBLIC);
    }

    story.setHashtags(extractHashtags(story.getContent()));

    // ✅ NEW: Upload images only if provided
    if (images != null && !images.isEmpty()) {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : images) {
            var upload = cloudinaryService.uploadImage(file);
            urls.add(upload.get("url"));
        }
        story.setImageUrls(urls);
    }

    story.setCreatedAt(LocalDateTime.now());
    story.setUpdatedAt(LocalDateTime.now());

    Story saved = storyRepository.save(story);
    return mapStoryToDTO(saved);
}




    /* =========================
       GET STORIES
    ========================== */
    public List<StoryResponseDTO> getAllPublicStories() {
        return storyRepository
                .findByVisibilityOrderByCreatedAtDesc(Visibility.PUBLIC)
                .stream()
                .map(this::mapStoryToDTO)
                .toList();
    }

    public List<StoryResponseDTO> getStoriesByUser(String username) {
        return storyRepository
                .findByUserIdAndVisibilityOrderByCreatedAtDesc(username, Visibility.PUBLIC)
                .stream()
                .map(this::mapStoryToDTO)
                .toList();
    }

    public List<StoryResponseDTO> getStoriesByHashtag(String tag) {
        return storyRepository
                .findByHashtagsAndVisibility(tag.toLowerCase(), Visibility.PUBLIC)
                .stream()
                .map(this::mapStoryToDTO)
                .toList();
    }

    /* =========================
       COMMENTS
    ========================== */
    public StoryResponseDTO addComment(String storyId, String text, String username) {

    Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found"));

    if (story.getVisibility() == Visibility.PRIVATE) {
        throw new RuntimeException("Cannot comment on private story");
    }

    Comment comment = Comment.builder()
            .id(UUID.randomUUID().toString())
            .text(text)
            .userId(username)
            .createdAt(LocalDateTime.now())
            .build();

    story.getComments().add(comment);

    Story saved = storyRepository.save(story);

    // 🔔 notification
    notificationService.notifyUser(
            story.getUserId(),
            username,
            story.getId(),
            NotificationType.COMMENT
    );

    // 🧠 NEW: strong learning signal
    preferenceService.recordInteraction(username, story);

    return mapStoryToDTO(saved);
}

    /* =========================
       REACTIONS
    ========================== */
    public StoryResponseDTO reactToStory(String storyId, String type, String username) {

    Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found"));

    // remove previous reaction by same user
    story.getReactions().removeIf(
            r -> r.getUserId().equals(username)
    );

    story.getReactions().add(
            Reaction.builder()
                    .userId(username)
                    .type(type)
                    .createdAt(LocalDateTime.now())
                    .build()
    );

    Story saved = storyRepository.save(story);

    // 🔔 notification
    notificationService.notifyUser(
            story.getUserId(),
            username,
            story.getId(),
            NotificationType.LIKE
    );

    // 🧠 NEW: teach recommendation engine
    preferenceService.recordInteraction(username, story);

    return mapStoryToDTO(saved);
}


    /* =========================
       DTO MAPPERS
    ========================== */
    public StoryResponseDTO mapStoryToDTO(Story story) {

    StoryResponseDTO dto = new StoryResponseDTO();

    dto.setId(story.getId());
    dto.setTitle(story.getTitle());
    dto.setContent(story.getContent());
    dto.setVisibility(story.getVisibility().name());
    dto.setCategory(story.getCategory().name());
    dto.setUserId(story.getUserId());
    dto.setCreatedAt(story.getCreatedAt());

    // ✅ Null-safe anonymous flag
    boolean isAnonymous = Boolean.TRUE.equals(story.getAnonymous());
    dto.setAnonymous(isAnonymous);

    dto.setReactionsCount(
        story.getReactions() == null ? 0 : story.getReactions().size()
    );

    // ✅ Only attach user when NOT anonymous
    if (!isAnonymous) {
        userRepository.findByUsername(story.getUserId())
                .ifPresent(user -> dto.setUser(mapUserToMiniDTO(user)));
    }

    dto.setImageUrls(
    story.getImageUrls() == null ? List.of() : story.getImageUrls()
);


    dto.setComments(
        story.getComments() == null
            ? List.of()
            : story.getComments().stream()
                .map(this::mapCommentToDTO)
                .toList()
    );

    return dto;
}


    private CommentResponseDTO mapCommentToDTO(Comment comment) {

        CommentResponseDTO.CommentResponseDTOBuilder builder =
                CommentResponseDTO.builder()
                        .id(comment.getId())
                        .text(comment.getText())
                        .createdAt(comment.getCreatedAt())
                        .userId(comment.getUserId());

        userRepository.findByUsername(comment.getUserId())
                .ifPresent(user -> builder
                        .username(user.getUsername())
                        .profileImageUrl(user.getProfileImageUrl()));

        return builder.build();
    }

    private UserMiniDTO mapUserToMiniDTO(User user) {
        return UserMiniDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .profileImageUrl(user.getProfileImageUrl())
                .build();
    }

    /* =========================
       UTIL
    ========================== */
    private List<String> extractHashtags(String content) {

        List<String> hashtags = new ArrayList<>();
        if (content == null) return hashtags;

        for (String word : content.split(" ")) {
            if (word.startsWith("#") && word.length() > 1) {
                hashtags.add(word.substring(1).toLowerCase());
            }
        }
        return hashtags;
    }

    public Page<StoryResponseDTO> getPagedPublicStories(Pageable pageable) {

        return storyRepository
                .findByVisibilityOrderByCreatedAtDesc(Visibility.PUBLIC, pageable)
                .map(this::mapStoryToDTO);
    }

    public Page<CommentResponseDTO> getPagedComments(
                String storyId,
                Pageable pageable
        ) {
            Story story = storyRepository.findById(storyId)
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Story not found"));

            List<Comment> comments =
                    story.getComments() == null
                            ? List.of()
                            : story.getComments();

            // sort manually (Mongo embedded list)
            List<Comment> sorted = comments.stream()
                    .sorted((a, b) ->
                            b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .toList();

            int start = (int) pageable.getOffset();
            int end = Math.min(start + pageable.getPageSize(), sorted.size());

            List<CommentResponseDTO> pageContent =
                    start > end
                            ? List.of()
                            : sorted.subList(start, end)
                                    .stream()
                                    .map(this::mapCommentToDTO)
                                    .toList();

            return new PageImpl<>(
                    pageContent,
                    pageable,
                    sorted.size()
            );
    }
    public List<StoryResponseDTO> getMyPrivateStories(String username) {

        return storyRepository
                .findByUserIdAndVisibilityOrderByCreatedAtDesc(
                        username,
                        Visibility.PRIVATE
                )
                .stream()
                .map(this::mapStoryToDTO)
                .toList();
    }

    public StoryResponseDTO getStoryById(
        String storyId,
        Authentication authentication
) {
    Story story = storyRepository.findById(storyId)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Story not found"));

    // PUBLIC story → anyone can see
    if (story.getVisibility() == Visibility.PUBLIC) {
        return mapStoryToDTO(story);
    }

    // PRIVATE story → only owner can see
    if (authentication == null) {
        throw new RuntimeException("Unauthorized");
    }

    String username = authentication.getName();

    if (!story.getUserId().equals(username)) {
        throw new RuntimeException("Access denied");
    }

    return mapStoryToDTO(story);
}

public StoryResponseDTO editStory(
        String storyId,
        EditStoryRequest body,
        String username
) {
    Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found"));

    // 🔐 Ownership check
    if (!story.getUserId().equals(username)) {
        throw new RuntimeException("Access denied");
    }

    if (body.getTitle() != null) {
        story.setTitle(body.getTitle());
    }

    if (body.getContent() != null) {
        story.setContent(body.getContent());
        story.setHashtags(extractHashtags(body.getContent()));
    }

    if (body.getVisibility() != null) {
        story.setVisibility(body.getVisibility());
    }

    // ✅ THIS LINE PREVENTS YOUR ERROR
    if (body.getImageUrls() != null) {
        story.setImageUrls(body.getImageUrls());
    }

    story.setUpdatedAt(LocalDateTime.now());

    return mapStoryToDTO(storyRepository.save(story));
}

public void deleteStory(String storyId, String username) {

    Story story = storyRepository.findById(storyId)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Story not found"));

    // 🔐 Ownership check
    if (!story.getUserId().equals(username)) {
        throw new RuntimeException("Access denied");
    }

    storyRepository.delete(story);
}

public StoryResponseDTO toggleVisibility(String storyId, String username) {

    Story story = storyRepository.findById(storyId)
            .orElseThrow(() ->
                    new ResourceNotFoundException("Story not found"));

    // 🔐 Ownership check
    if (!story.getUserId().equals(username)) {
        throw new RuntimeException("Access denied");
    }

    // 🔄 Toggle
    if (story.getVisibility() == Visibility.PUBLIC) {
        story.setVisibility(Visibility.PRIVATE);
    } else {
        story.setVisibility(Visibility.PUBLIC);
    }

    story.setUpdatedAt(LocalDateTime.now());

    return mapStoryToDTO(storyRepository.save(story));
}

public List<StoryResponseDTO> getStoriesByCategory(String category) {

    // 🟢 Handle ALL / empty category
    if (category == null || category.equalsIgnoreCase("ALL")) {
        return storyRepository
                .findByVisibilityOrderByCreatedAtDesc(Visibility.PUBLIC)
                .stream()
                .map(this::mapStoryToDTO)
                .toList();
    }

    StoryCategory storyCategory;
    try {
        storyCategory = StoryCategory.valueOf(category.toUpperCase());
    } catch (IllegalArgumentException e) {
        throw new RuntimeException(
                "Invalid category. Allowed: GENERAL, HEALING, LOVE, HEARTBREAK, MOTIVATION, LIFE"
        );
    }

    return storyRepository
            .findByCategoryAndVisibilityOrderByCreatedAtDesc(
                    storyCategory,
                    Visibility.PUBLIC
            )
            .stream()
            .map(this::mapStoryToDTO)
            .toList();
}

public Page<StoryResponseDTO> searchStories(
        String query,
        Pageable pageable
) {
    if (query == null || query.trim().isEmpty()) {
        return Page.empty(pageable);
    }

    return storyRepository
            .findByVisibilityAndContentContainingIgnoreCaseOrTitleContainingIgnoreCase(
                    Visibility.PUBLIC,
                    query,
                    query,
                    pageable
            )
            .map(this::mapStoryToDTO);
}

public StoryResponseDTO deleteComment(String storyId, String commentId, String username) {

    Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found"));

    if (story.getComments() == null || story.getComments().isEmpty()) {
        throw new ResourceNotFoundException("No comments found");
    }

    Comment comment = story.getComments().stream()
            .filter(c -> c.getId().equals(commentId))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

    // 🔐 Allow delete only by comment owner OR story owner
    if (!comment.getUserId().equals(username) && !story.getUserId().equals(username)) {
        throw new RuntimeException("Access denied");
    }

    story.getComments().removeIf(c -> c.getId().equals(commentId));

    Story saved = storyRepository.save(story);
    return mapStoryToDTO(saved);
}

// ❤️ Most Liked
public List<StoryResponseDTO> getMostLikedStories() {
    Pageable pageable = PageRequest.of(0, 50); // limit to 50

    return storyRepository.findByVisibility(Visibility.PUBLIC, pageable)
            .getContent()
            .stream()
            .sorted((a, b) -> {
                int likesA = a.getReactions() == null ? 0 : a.getReactions().size();
                int likesB = b.getReactions() == null ? 0 : b.getReactions().size();
                return Integer.compare(likesB, likesA);
            })
            .map(this::mapStoryToDTO)
            .toList();
}


// 🔥 Trending = likes + comments + recency
public List<StoryResponseDTO> getTrendingStories() {

    Pageable pageable = PageRequest.of(0, 100);

    return storyRepository.findByVisibility(Visibility.PUBLIC, pageable)
            .getContent()
            .stream()
            .sorted((a, b) -> {
                int scoreA = calculateScore(a);
                int scoreB = calculateScore(b);
                return Integer.compare(scoreB, scoreA);
            })
            .map(this::mapStoryToDTO)
            .toList();
}


private int calculateScore(Story story) {
    int likes = story.getReactions() == null ? 0 : story.getReactions().size();
    int comments = story.getComments() == null ? 0 : story.getComments().size();

    long hoursAgo = java.time.Duration.between(
            story.getCreatedAt(),
            LocalDateTime.now()
    ).toHours();

    // formula:
    // likes * 2 + comments * 3 - age penalty
    return (likes * 2) + (comments * 3) - (int) hoursAgo;
}

public List<StoryResponseDTO> getPersonalizedFeed(String username) {

    List<Story> all = storyRepository
            .findByVisibilityOrderByCreatedAtDesc(Visibility.PUBLIC);

    var pref = preferenceService.getPreferences(username);

    return all.stream()
        .sorted((a, b) -> score(b, pref) - score(a, pref))
        .map(this::mapStoryToDTO)
        .toList();
}
private int score(Story story, UserPreference pref) {

    int score = 0;

    // Base popularity
    score += story.getReactions() != null ? story.getReactions().size() * 3 : 0;
    score += story.getComments() != null ? story.getComments().size() * 2 : 0;

    // Freshness boost
    if (story.getCreatedAt() != null &&
        story.getCreatedAt().isAfter(LocalDateTime.now().minusHours(24))) {
        score += 5;
    }

    if (pref == null) return score;

    // Category match
    score += pref.getCategoryScores()
        .getOrDefault(story.getCategory().name(), 0) * 4;

    // Author affinity
    score += pref.getAuthorScores()
        .getOrDefault(story.getUserId(), 0) * 5;

    // Hashtag affinity
    if (story.getHashtags() != null) {
        for (String tag : story.getHashtags()) {
            score += pref.getHashtagScores().getOrDefault(tag, 0) * 2;
        }
    }

    return score;
}




}
