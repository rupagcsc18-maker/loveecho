package com.app.loveecho.mongo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.app.loveecho.jpa.entity.StoryCategory;
import com.app.loveecho.jpa.entity.Visibility;
import com.app.loveecho.mongo.document.Story;

import java.util.Optional;

public interface StoryRepository extends MongoRepository<Story, String> {
    List<Story> findByUserId(String userId);

    Optional<Story> findById(String id);

    List<Story> findByHashtags(String hashtag);

    Page<Story> findAll(Pageable pageable);

    List<Story> findByCategoryAndVisibilityOrderByCreatedAtDesc(
        StoryCategory category,
        Visibility visibility
);



    List<Story> findByUserIdAndVisibility(String userId, Visibility visibility);

    List<Story> findByHashtagsAndVisibility(String tag, Visibility visibility);

    List<Story> findByUserIdAndVisibilityOrderByCreatedAtDesc(String userId, Visibility visibility);

    Page<Story> findByVisibility(Visibility visibility, Pageable pageable);

    List<Story> findByVisibilityOrderByCreatedAtDesc(Visibility visibility);

    Page<Story> findByVisibilityOrderByCreatedAtDesc(
            Visibility visibility,
            Pageable pageable
    );

    Page<Story> findByVisibilityAndContentContainingIgnoreCaseOrTitleContainingIgnoreCase(
        Visibility visibility,
        String content,
        String title,
        Pageable pageable
     );

     long countByUserId(String userId);
long countByUserIdAndVisibility(String userId, Visibility visibility);
     


    


}
