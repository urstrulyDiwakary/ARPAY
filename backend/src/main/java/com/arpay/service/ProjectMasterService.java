package com.arpay.service;

import com.arpay.dto.ProjectMasterDTO;
import com.arpay.entity.ProjectMaster;
import com.arpay.repository.ProjectMasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ProjectMasterService {

    @Autowired
    private ProjectMasterRepository projectMasterRepository;

    // Convert entity to DTO
    private ProjectMasterDTO convertToDTO(ProjectMaster entity) {
        if (entity == null) return null;
        ProjectMasterDTO dto = new ProjectMasterDTO();
        dto.setId(entity.getId());
        dto.setProjectName(entity.getProjectName());
        dto.setPropertyName(entity.getPropertyName());
        dto.setPlotNumber(entity.getPlotNumber());
        dto.setPlotArea(entity.getPlotArea());
        dto.setPlotPrice(entity.getPlotPrice());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setIsActive(entity.getIsActive());
        return dto;
    }

    // Convert DTO to entity
    private ProjectMaster convertToEntity(ProjectMasterDTO dto) {
        if (dto == null) return null;
        ProjectMaster entity = new ProjectMaster();
        entity.setId(dto.getId());
        entity.setProjectName(dto.getProjectName());
        entity.setPropertyName(dto.getPropertyName());
        entity.setPlotNumber(dto.getPlotNumber());
        entity.setPlotArea(dto.getPlotArea());
        entity.setPlotPrice(dto.getPlotPrice());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : true);
        return entity;
    }

    // Get all active project masters
    public List<ProjectMasterDTO> getAllProjectMasters() {
        return projectMasterRepository.findByIsActiveTrue()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get by ID
    public ProjectMasterDTO getById(Long id) {
        return projectMasterRepository.findById(id)
                .map(this::convertToDTO)
                .orElse(null);
    }

    // Get by project name
    public List<ProjectMasterDTO> getByProjectName(String projectName) {
        return projectMasterRepository.findByProjectNameAndIsActiveTrue(projectName)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get by property name
    public List<ProjectMasterDTO> getByPropertyName(String propertyName) {
        return projectMasterRepository.findByPropertyNameAndIsActiveTrue(propertyName)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // Get specific plot details
    public ProjectMasterDTO getPlotDetails(String projectName, String plotNumber) {
        ProjectMaster master = projectMasterRepository
                .findByProjectNameAndPlotNumberAndIsActiveTrue(projectName, plotNumber);
        return master != null ? convertToDTO(master) : null;
    }

    // Get unique project names
    public List<String> getUniqueProjectNames() {
        return projectMasterRepository.findUniqueProjectNames();
    }

    // Get unique properties for a project
    public List<String> getUniquePropertiesByProject(String projectName) {
        return projectMasterRepository.findUniquePropertiesByProject(projectName);
    }

    // Get unique plot numbers for a project
    public List<String> getUniquePlotNumbersByProject(String projectName) {
        return projectMasterRepository.findUniquePlotNumbersByProject(projectName);
    }

    // Create new project master
    public ProjectMasterDTO create(ProjectMasterDTO dto) {
        ProjectMaster entity = convertToEntity(dto);
        ProjectMaster saved = projectMasterRepository.save(entity);
        return convertToDTO(saved);
    }

    // Update project master
    public ProjectMasterDTO update(Long id, ProjectMasterDTO dto) {
        Optional<ProjectMaster> existing = projectMasterRepository.findById(id);
        if (existing.isPresent()) {
            ProjectMaster entity = existing.get();
            entity.setProjectName(dto.getProjectName());
            entity.setPropertyName(dto.getPropertyName());
            entity.setPlotNumber(dto.getPlotNumber());
            entity.setPlotArea(dto.getPlotArea());
            entity.setPlotPrice(dto.getPlotPrice());
            ProjectMaster updated = projectMasterRepository.save(entity);
            return convertToDTO(updated);
        }
        return null;
    }

    // Delete (soft delete - mark as inactive)
    public boolean delete(Long id) {
        Optional<ProjectMaster> existing = projectMasterRepository.findById(id);
        if (existing.isPresent()) {
            ProjectMaster entity = existing.get();
            entity.setIsActive(false);
            projectMasterRepository.save(entity);
            return true;
        }
        return false;
    }

    // Hard delete
    public boolean hardDelete(Long id) {
        if (projectMasterRepository.existsById(id)) {
            projectMasterRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // Get total count
    public long getTotalCount() {
        return projectMasterRepository.countActive();
    }

    // Get total area by project
    public Double getTotalAreaByProject(String projectName) {
        return projectMasterRepository.getTotalAreaByProject(projectName);
    }

    // Get total value by project
    public Double getTotalValueByProject(String projectName) {
        return projectMasterRepository.getTotalValueByProject(projectName);
    }

    // Bulk create
    public List<ProjectMasterDTO> bulkCreate(List<ProjectMasterDTO> dtos) {
        return dtos.stream()
                .map(this::create)
                .collect(Collectors.toList());
    }

    // Check if plot exists
    public boolean plotExists(String projectName, String plotNumber) {
        return projectMasterRepository.existsByProjectNameAndPlotNumber(projectName, plotNumber);
    }
}

