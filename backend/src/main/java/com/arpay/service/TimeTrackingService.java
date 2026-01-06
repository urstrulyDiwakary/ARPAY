package com.arpay.service;

import com.arpay.dto.PageResponse;
import com.arpay.dto.TimeTrackingDTO;
import com.arpay.entity.TimeTracking;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface TimeTrackingService {
    TimeTrackingDTO createTimeEntry(TimeTrackingDTO timeTrackingDTO);
    TimeTrackingDTO updateTimeEntry(UUID id, TimeTrackingDTO timeTrackingDTO);
    TimeTrackingDTO getTimeEntryById(UUID id);
    PageResponse<TimeTrackingDTO> getAllTimeEntries(int page, int size, String sortBy, String sortDir);
    PageResponse<TimeTrackingDTO> getTimeEntriesByUserId(UUID userId, int page, int size);
    PageResponse<TimeTrackingDTO> getTimeEntriesByProject(String projectName, int page, int size);
    void deleteTimeEntry(UUID id);
    BigDecimal getTotalHoursByUserId(UUID userId);
    BigDecimal getTotalHoursByProject(String projectName);
    List<String> getAllProjectNames();
}

