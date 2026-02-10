package com.arpay.repository;

import com.arpay.entity.ProjectMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMasterRepository extends JpaRepository<ProjectMaster, Long> {

    // Find all active project masters
    List<ProjectMaster> findByIsActiveTrue();

    // Find project masters by project name
    List<ProjectMaster> findByProjectNameAndIsActiveTrue(String projectName);

    // Find project masters by property name
    List<ProjectMaster> findByPropertyNameAndIsActiveTrue(String propertyName);

    // Find by plot number and project name
    ProjectMaster findByProjectNameAndPlotNumberAndIsActiveTrue(String projectName, String plotNumber);

    // Get unique project names
    @Query("SELECT DISTINCT pm.projectName FROM ProjectMaster pm WHERE pm.isActive = true ORDER BY pm.projectName")
    List<String> findUniqueProjectNames();

    // Get unique property names for a project
    @Query("SELECT DISTINCT pm.propertyName FROM ProjectMaster pm WHERE pm.projectName = :projectName AND pm.isActive = true ORDER BY pm.propertyName")
    List<String> findUniquePropertiesByProject(@Param("projectName") String projectName);

    // Get unique plot numbers for a project
    @Query("SELECT DISTINCT pm.plotNumber FROM ProjectMaster pm WHERE pm.projectName = :projectName AND pm.isActive = true ORDER BY pm.plotNumber")
    List<String> findUniquePlotNumbersByProject(@Param("projectName") String projectName);

    // Check if plot exists
    boolean existsByProjectNameAndPlotNumber(String projectName, String plotNumber);

    // Get total count of active masters
    @Query("SELECT COUNT(pm) FROM ProjectMaster pm WHERE pm.isActive = true")
    long countActive();

    // Get total area for a project
    @Query("SELECT COALESCE(SUM(pm.plotArea), 0.0) FROM ProjectMaster pm WHERE pm.projectName = :projectName AND pm.isActive = true")
    Double getTotalAreaByProject(@Param("projectName") String projectName);

    // Get total value for a project
    @Query("SELECT COALESCE(SUM(pm.plotArea * pm.plotPrice), 0.0) FROM ProjectMaster pm WHERE pm.projectName = :projectName AND pm.isActive = true")
    Double getTotalValueByProject(@Param("projectName") String projectName);
}

