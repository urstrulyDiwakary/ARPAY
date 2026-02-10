package com.arpay.controller;

import com.arpay.dto.ProjectMasterDTO;
import com.arpay.service.ProjectMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/project-masters")
@CrossOrigin(origins = "*")
public class ProjectMasterController {

    @Autowired
    private ProjectMasterService projectMasterService;

    /**
     * Get all project masters
     */
    @GetMapping
    public ResponseEntity<?> getAllProjectMasters() {
        try {
            List<ProjectMasterDTO> masters = projectMasterService.getAllProjectMasters();
            return ResponseEntity.ok(masters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch project masters", e.getMessage()));
        }
    }

    /**
     * Get project master by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            ProjectMasterDTO master = projectMasterService.getById(id);
            if (master != null) {
                return ResponseEntity.ok(master);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Project master not found", "ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error fetching project master", e.getMessage()));
        }
    }

    /**
     * Get by project name
     */
    @GetMapping("/by-project/{projectName}")
    public ResponseEntity<?> getByProjectName(@PathVariable String projectName) {
        try {
            List<ProjectMasterDTO> masters = projectMasterService.getByProjectName(projectName);
            return ResponseEntity.ok(masters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch project masters", e.getMessage()));
        }
    }

    /**
     * Get by property name
     */
    @GetMapping("/by-property/{propertyName}")
    public ResponseEntity<?> getByPropertyName(@PathVariable String propertyName) {
        try {
            List<ProjectMasterDTO> masters = projectMasterService.getByPropertyName(propertyName);
            return ResponseEntity.ok(masters);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch project masters", e.getMessage()));
        }
    }

    /**
     * Get specific plot details
     */
    @GetMapping("/plot-details")
    public ResponseEntity<?> getPlotDetails(
            @RequestParam String projectName,
            @RequestParam String plotNumber) {
        try {
            ProjectMasterDTO plot = projectMasterService.getPlotDetails(projectName, plotNumber);
            if (plot != null) {
                return ResponseEntity.ok(plot);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Plot not found",
                            "Project: " + projectName + ", Plot: " + plotNumber));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error fetching plot details", e.getMessage()));
        }
    }

    /**
     * Get unique project names
     */
    @GetMapping("/unique/projects")
    public ResponseEntity<?> getUniqueProjectNames() {
        try {
            List<String> projects = projectMasterService.getUniqueProjectNames();
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch project names", e.getMessage()));
        }
    }

    /**
     * Get unique properties for a project
     */
    @GetMapping("/unique/properties/{projectName}")
    public ResponseEntity<?> getUniquePropertiesByProject(@PathVariable String projectName) {
        try {
            List<String> properties = projectMasterService.getUniquePropertiesByProject(projectName);
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch properties", e.getMessage()));
        }
    }

    /**
     * Get unique plot numbers for a project
     */
    @GetMapping("/unique/plots/{projectName}")
    public ResponseEntity<?> getUniquePlotNumbersByProject(@PathVariable String projectName) {
        try {
            List<String> plots = projectMasterService.getUniquePlotNumbersByProject(projectName);
            return ResponseEntity.ok(plots);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch plot numbers", e.getMessage()));
        }
    }

    /**
     * Create new project master
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProjectMasterDTO dto) {
        try {
            if (!isValidDTO(dto)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Invalid data", "All fields are required"));
            }

            ProjectMasterDTO created = projectMasterService.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to create project master", e.getMessage()));
        }
    }

    /**
     * Update project master
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProjectMasterDTO dto) {
        try {
            if (!isValidDTO(dto)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(createErrorResponse("Invalid data", "All fields are required"));
            }

            ProjectMasterDTO updated = projectMasterService.update(id, dto);
            if (updated != null) {
                return ResponseEntity.ok(updated);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Project master not found", "ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to update project master", e.getMessage()));
        }
    }

    /**
     * Delete project master (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            boolean deleted = projectMasterService.delete(id);
            if (deleted) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Project master deleted successfully");
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(createErrorResponse("Project master not found", "ID: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to delete project master", e.getMessage()));
        }
    }

    /**
     * Bulk create project masters
     */
    @PostMapping("/bulk")
    public ResponseEntity<?> bulkCreate(@RequestBody List<ProjectMasterDTO> dtos) {
        try {
            List<ProjectMasterDTO> created = projectMasterService.bulkCreate(dtos);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to create project masters", e.getMessage()));
        }
    }

    /**
     * Get statistics
     */
    @GetMapping("/stats/summary")
    public ResponseEntity<?> getStatistics() {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalCount", projectMasterService.getTotalCount());
            stats.put("totalProjects", projectMasterService.getUniqueProjectNames().size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch statistics", e.getMessage()));
        }
    }

    /**
     * Get statistics by project
     */
    @GetMapping("/stats/project/{projectName}")
    public ResponseEntity<?> getProjectStatistics(@PathVariable String projectName) {
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("projectName", projectName);
            stats.put("totalArea", projectMasterService.getTotalAreaByProject(projectName));
            stats.put("totalValue", projectMasterService.getTotalValueByProject(projectName));
            stats.put("plotCount", projectMasterService.getByProjectName(projectName).size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Failed to fetch project statistics", e.getMessage()));
        }
    }

    /**
     * Check if plot exists
     */
    @GetMapping("/exists")
    public ResponseEntity<?> checkPlotExists(
            @RequestParam String projectName,
            @RequestParam String plotNumber) {
        try {
            boolean exists = projectMasterService.plotExists(projectName, plotNumber);
            Map<String, Boolean> response = new HashMap<>();
            response.put("exists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error checking plot existence", e.getMessage()));
        }
    }

    // Helper method to validate DTO
    private boolean isValidDTO(ProjectMasterDTO dto) {
        // Check required string fields
        if (dto.getProjectName() == null || dto.getProjectName().isEmpty() ||
            dto.getPropertyName() == null || dto.getPropertyName().isEmpty() ||
            dto.getPlotNumber() == null || dto.getPlotNumber().isEmpty()) {
            return false;
        }

        // Check numeric fields
        if (dto.getPlotArea() == null || dto.getPlotPrice() == null) {
            return false;
        }

        // Allow placeholder entries with __PLACEHOLDER__ plot number and zero values
        // These are used to register project+property combinations
        if ("__PLACEHOLDER__".equals(dto.getPlotNumber())) {
            return dto.getPlotArea() >= 0 && dto.getPlotPrice() >= 0;
        }

        // For real plots, require positive values
        return dto.getPlotArea() > 0 && dto.getPlotPrice() > 0;
    }

    // Helper method to create error response
    private Map<String, String> createErrorResponse(String error, String message) {
        Map<String, String> response = new HashMap<>();
        response.put("error", error);
        response.put("message", message);
        return response;
    }
}

