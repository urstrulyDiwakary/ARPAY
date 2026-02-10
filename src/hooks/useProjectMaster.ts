import { useQuery } from '@tanstack/react-query';
import { projectMasterApi } from '@/services/api';
import { ProjectMaster } from '@/types';

/**
 * Hook to fetch all project masters
 */
export const useProjectMasters = () => {
  return useQuery({
    queryKey: ['projectMasters'],
    queryFn: projectMasterApi.getAll,
  });
};

/**
 * Hook to fetch project masters filtered by project name
 */
export const useProjectMastersByProject = (projectName?: string) => {
  return useQuery({
    queryKey: ['projectMasters', projectName],
    queryFn: () => projectName ? projectMasterApi.getByProject(projectName) : projectMasterApi.getAll(),
    enabled: !!projectName,
  });
};

/**
 * Hook to fetch unique project names
 */
export const useUniqueProjects = () => {
  const { data: masters } = useProjectMasters();
  return [...new Set(masters?.map(m => m.projectName) || [])];
};

/**
 * Hook to fetch unique properties for a project
 */
export const useProjectProperties = (projectName?: string) => {
  return useQuery({
    queryKey: ['projectProperties', projectName],
    queryFn: () => projectName ? projectMasterApi.getUniqueProperties(projectName) : Promise.resolve([]),
    enabled: !!projectName,
  });
};

/**
 * Hook to fetch plot numbers for a project
 */
export const useProjectPlots = (projectName?: string) => {
  return useQuery({
    queryKey: ['projectPlots', projectName],
    queryFn: () => projectName ? projectMasterApi.getUniquePlotNumbers(projectName) : Promise.resolve([]),
    enabled: !!projectName,
  });
};

/**
 * Hook to fetch specific plot details
 */
export const usePlotDetails = (projectName?: string, plotNumber?: string) => {
  return useQuery({
    queryKey: ['plotDetails', projectName, plotNumber],
    queryFn: () => projectName && plotNumber ? projectMasterApi.getPlotDetails(projectName, plotNumber) : Promise.resolve(null),
    enabled: !!projectName && !!plotNumber,
  });
};

/**
 * Utility function to get all available projects as options
 */
export const getProjectOptions = (masters: ProjectMaster[]) => {
  const unique = [...new Set(masters.map(m => m.projectName))];
  return unique.map(name => ({ label: name, value: name }));
};

/**
 * Utility function to get properties for a project as options
 */
export const getPropertyOptions = (masters: ProjectMaster[], projectName: string) => {
  const properties = [...new Set(
    masters
      .filter(m => m.projectName === projectName)
      .map(m => m.propertyName)
  )];
  return properties.map(name => ({ label: name, value: name }));
};

/**
 * Utility function to get plots for a project as options
 */
export const getPlotOptions = (masters: ProjectMaster[], projectName: string) => {
  const plots = masters.filter(m => m.projectName === projectName);
  return plots.map(plot => ({
    label: `Plot ${plot.plotNumber} (${plot.plotArea} cents) - ₹${(plot.plotArea * plot.plotPrice).toLocaleString('en-IN')}`,
    value: plot.id,
    master: plot,
  }));
};

/**
 * Utility function to get plot with details by ID
 */
export const getPlotById = (masters: ProjectMaster[], plotId: string): ProjectMaster | undefined => {
  return masters.find(m => m.id === plotId);
};

/**
 * Utility function to calculate total value of multiple plots
 */
export const calculateTotalValue = (masters: ProjectMaster[], plotIds: string[]): number => {
  return plotIds.reduce((total, plotId) => {
    const plot = getPlotById(masters, plotId);
    return total + (plot ? plot.plotArea * plot.plotPrice : 0);
  }, 0);
};

