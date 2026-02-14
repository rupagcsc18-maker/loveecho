package com.app.loveecho.dto;

import com.app.loveecho.jpa.entity.Visibility;
import lombok.Data;
import java.util.List;


@Data
public class EditStoryRequest {

    private String title;
    private String content;
    private Visibility visibility;

    // ✅ THIS FIXES EVERYTHING
    private List<String> imageUrls;
}