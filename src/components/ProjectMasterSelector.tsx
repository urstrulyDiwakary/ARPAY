import { useState } from 'react';
import { useProjectMasters, useProjectProperties, useProjectPlots, usePlotDetails } from '@/hooks/useProjectMaster';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProjectMasterSelectorProps {
  onSelect?: (plotData: any) => void;
  selectedProjectName?: string;
  selectedPlotId?: string;
  showDetails?: boolean;
}

export function ProjectMasterSelector({
  onSelect,
  selectedProjectName,
  selectedPlotId,
  showDetails = true,
}: ProjectMasterSelectorProps) {
  const [projectName, setProjectName] = useState(selectedProjectName || '');
  const [propertyName, setPropertyName] = useState('');
  const [plotNumber, setPlotNumber] = useState('');

  const { data: masters = [] } = useProjectMasters();
  const { data: properties = [] } = useProjectProperties(projectName);
  const { data: plots = [] } = useProjectPlots(projectName);

  // Get unique projects
  const uniqueProjects = [...new Set(masters.map(m => m.projectName))];

  // Get plots for selected project and property
  const filteredPlots = masters.filter(m =>
    m.projectName === projectName &&
    (!propertyName || m.propertyName === propertyName)
  );

  // Get selected plot details
  const selectedPlot = masters.find(m => m.id === selectedPlotId);

  const handleProjectChange = (value: string) => {
    setProjectName(value);
    setPropertyName('');
    setPlotNumber('');
  };

  const handlePropertyChange = (value: string) => {
    setPropertyName(value);
    setPlotNumber('');
  };

  const handlePlotChange = (value: string) => {
    const plot = masters.find(m => m.id === value);
    if (plot) {
      setPlotNumber(plot.plotNumber);
      if (onSelect) {
        onSelect({
          id: plot.id,
          projectName: plot.projectName,
          propertyName: plot.propertyName,
          plotNumber: plot.plotNumber,
          plotArea: plot.plotArea,
          plotPrice: plot.plotPrice,
          totalValue: plot.plotArea * plot.plotPrice,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Project Selection */}
      <div className="space-y-2">
        <Label htmlFor="project-select">Project Name *</Label>
        <Select value={projectName} onValueChange={handleProjectChange}>
          <SelectTrigger id="project-select">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {uniqueProjects.map(project => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Property Selection */}
      {projectName && (
        <div className="space-y-2">
          <Label htmlFor="property-select">Property/Phase Name</Label>
          <Select value={propertyName} onValueChange={handlePropertyChange}>
            <SelectTrigger id="property-select">
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Properties</SelectItem>
              {properties.map(property => (
                <SelectItem key={property} value={property}>
                  {property}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Plot Selection */}
      {projectName && (
        <div className="space-y-2">
          <Label htmlFor="plot-select">Plot Number *</Label>
          <Select value={selectedPlotId || ''} onValueChange={handlePlotChange}>
            <SelectTrigger id="plot-select">
              <SelectValue placeholder="Select a plot" />
            </SelectTrigger>
            <SelectContent>
              {filteredPlots.map(plot => (
                <SelectItem key={plot.id} value={plot.id}>
                  Plot {plot.plotNumber} ({plot.plotArea} cents) - ₹{(plot.plotArea * plot.plotPrice).toLocaleString('en-IN')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Details Display */}
      {showDetails && selectedPlot && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Project</span>
              <Badge variant="outline">{selectedPlot.projectName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Property</span>
              <Badge variant="secondary">{selectedPlot.propertyName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Plot Number</span>
              <Badge>{selectedPlot.plotNumber}</Badge>
            </div>
            <div className="border-t border-blue-200 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plot Area</span>
                <span className="font-mono font-semibold">{selectedPlot.plotArea} Cents</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price per Cent</span>
                <span className="font-mono font-semibold">₹{selectedPlot.plotPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between bg-white rounded p-2">
                <span className="text-sm font-semibold">Total Value</span>
                <span className="text-lg font-bold text-blue-600">
                  ₹{(selectedPlot.plotArea * selectedPlot.plotPrice).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ProjectMasterSelector;

