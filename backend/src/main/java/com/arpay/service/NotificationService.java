package com.arpay.service;

import com.arpay.dto.NotificationDTO;
import com.arpay.dto.PageResponse;

import java.util.List;
import java.util.UUID;

public interface NotificationService {
    NotificationDTO createNotification(NotificationDTO notificationDTO);
    NotificationDTO getNotificationById(UUID id);
    PageResponse<NotificationDTO> getNotificationsByUserId(UUID userId, int page, int size);
    List<NotificationDTO> getRecentNotificationsByUserId(UUID userId, int limit);
    NotificationDTO markAsRead(UUID id);
    int markAllAsReadByUserId(UUID userId);
    void deleteNotification(UUID id);
    long countUnreadByUserId(UUID userId);
}

