import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { projectApi, realEstateProjectApi } from '@/services/api';
import { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Home,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  MapPin,
  Users,
  BarChart3,
  PieChart,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<string, string> = {
  'Not Started': 'bg-slate-500/10 text-slate-600',
  'In Progress': 'bg-blue-500/10 text-blue-600',
  'On Hold': 'bg-amber-500/10 text-amber-600',
  'Completed': 'bg-green-500/10 text-green-600',
  'Cancelled': 'bg-destructive/10 text-destructive',
};

const saleStatusColors: Record<string, string> = {
  'completed': 'bg-green-500/10 text-green-600 border-green-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'pending': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'rejected': 'bg-destructive/10 text-destructive border-destructive/20',
};

const saleStatusIcons: Record<string, any> = {
  'completed': CheckCircle,
  'in-progress': Clock,
  'pending': AlertCircle,
  'rejected': XCircle,
};

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getById(projectId!),
  });

  const { data: reDetails, isLoading: reDetailsLoading } = useQuery({
    queryKey: ['realEstateDetails', projectId],
    queryFn: () => projectId ? realEstateProjectApi.getDetails(projectId) : null,
    enabled: project?.projectType === 'real-estate',
  });

  const { data: salesMetrics } = useQuery({
    queryKey: ['salesMetrics', projectId],
    queryFn: () => projectId ? realEstateProjectApi.getSalesMetrics(projectId) : null,
    enabled: project?.projectType === 'real-estate',
  });

  const { data: expensesMetrics } = useQuery({
    queryKey: ['expensesMetrics', projectId],
    queryFn: () => projectId ? realEstateProjectApi.getExpensesMetrics(projectId) : null,
    enabled: project?.projectType === 'real-estate',
  });

  const { data: timelineMetrics } = useQuery({
    queryKey: ['timelineMetrics', projectId],
    queryFn: () => projectId ? realEstateProjectApi.getTimelineMetrics(projectId) : null,
    enabled: project?.projectType === 'real-estate',
  });

  if (isLoading || !projectId) {
    return (
      <MainLayout title="Project Details">
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout title="Project Details">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </MainLayout>
    );
  }

  const daysRemaining = Math.ceil(
    (new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <MainLayout title={project.name}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/projects')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <Badge className={statusColors[project.status]}>
            {project.status}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-lg font-bold">{project.customer}</p>
                </div>
                <Home className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-lg font-bold">{project.progress}%</p>
                  <Progress value={project.progress} className="mt-2 h-1.5" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-lg font-bold">₹{(project.budget / 1000000).toFixed(1)}M</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spent: ₹{(project.spent / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Timeline</p>
                  <p className="text-lg font-bold">
                    {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d Overdue` : `${daysRemaining}d Left`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{project.endDate}</p>
                </div>
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real Estate Specific Content */}
        {project.projectType === 'real-estate' && reDetails && (
          <>
            {/* Real Estate Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Units</p>
                      <p className="text-2xl font-bold">{reDetails.totalUnitsAvailable}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sold: {reDetails.totalUnitsSold}
                      </p>
                    </div>
                    <Home className="h-5 w-5 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sales Value</p>
                      <p className="text-lg font-bold">₹{(reDetails.totalSalesValue / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Conv: {(reDetails.totalUnitsSold / reDetails.totalUnitsAvailable * 100).toFixed(0)}%
                      </p>
                    </div>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">{reDetails.salesInProgress}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pending: {reDetails.salesPending}
                      </p>
                    </div>
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-lg font-bold max-w-[150px] line-clamp-2">
                        {reDetails.projectLocation}
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for detailed views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Project Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Budget</p>
                        <p className="text-2xl font-bold">₹{(reDetails.totalBudget / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Expenses</p>
                        <p className="text-2xl font-bold">₹{(reDetails.totalExpenses / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sales Value</p>
                        <p className="text-2xl font-bold">₹{(reDetails.totalSalesValue / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Profit/Loss</p>
                        <p className={`text-2xl font-bold ${reDetails.totalSalesValue - reDetails.totalExpenses > 0 ? 'text-green-600' : 'text-destructive'}`}>
                          ₹{((reDetails.totalSalesValue - reDetails.totalExpenses) / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Budget Utilization</span>
                          <span className="text-sm font-bold">{((reDetails.totalExpenses / reDetails.totalBudget) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(reDetails.totalExpenses / reDetails.totalBudget) * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Units Sold</span>
                          <span className="text-sm font-bold">{((reDetails.totalUnitsSold / reDetails.totalUnitsAvailable) * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={(reDetails.totalUnitsSold / reDetails.totalUnitsAvailable) * 100} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value="sales" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">
                        {reDetails.sales.filter((s: any) => s.status === 'completed').length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold text-blue-600">{reDetails.salesInProgress}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-amber-600">{reDetails.salesPending}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold text-destructive">{reDetails.salesRejected}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Plot Number</TableHead>
                            <TableHead>Buyer Name</TableHead>
                            <TableHead>Sale Amount</TableHead>
                            <TableHead>Payment Received</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reDetails.sales.map((sale: any) => {
                            const StatusIcon = saleStatusIcons[sale.status];
                            return (
                              <TableRow key={sale.id}>
                                <TableCell className="font-medium">{sale.plotNumber}</TableCell>
                                <TableCell>{sale.buyerName}</TableCell>
                                <TableCell>₹{(sale.saleAmount / 100000).toFixed(2)}L</TableCell>
                                <TableCell className="text-green-600 font-medium">₹{(sale.paymentReceived / 100000).toFixed(2)}L</TableCell>
                                <TableCell className="text-amber-600 font-medium">₹{(sale.remainingAmount / 100000).toFixed(2)}L</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={saleStatusColors[sale.status]}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Expenses Tab */}
              <TabsContent value="expenses" className="space-y-4">
                {expensesMetrics && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Budget</p>
                          <p className="text-2xl font-bold">₹{(expensesMetrics.totalBudget / 1000000).toFixed(1)}M</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Expenses</p>
                          <p className="text-2xl font-bold">₹{(expensesMetrics.totalExpenses / 1000000).toFixed(1)}M</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Remaining</p>
                          <p className="text-2xl font-bold text-green-600">₹{(expensesMetrics.remainingBudget / 1000000).toFixed(1)}M</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Budget Utilization</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">Utilization Rate</span>
                            <span className="font-bold">{expensesMetrics.budgetUtilization}%</span>
                          </div>
                          <Progress value={parseFloat(expensesMetrics.budgetUtilization)} className="h-3" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Expense Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {reDetails.expenses.map((expense: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                              <div className="flex-1">
                                <p className="font-medium">{expense.category}</p>
                                <p className="text-xs text-muted-foreground">{expense.date}</p>
                              </div>
                              <p className="font-bold">₹{(expense.amount / 1000000).toFixed(2)}M</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4">
                {timelineMetrics && (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Total Phases</p>
                          <p className="text-2xl font-bold">{timelineMetrics.totalPhases}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold text-green-600">{timelineMetrics.completedPhases}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Completion %</p>
                          <p className="text-2xl font-bold">{timelineMetrics.completionPercentage}%</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Project Timeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {timelineMetrics.timeline.map((phase: any, idx: number) => {
                          const statusColor =
                            phase.status === 'completed' ? 'text-green-600 bg-green-500/10' :
                            phase.status === 'ongoing' ? 'text-blue-600 bg-blue-500/10' :
                            'text-gray-600 bg-gray-500/10';

                          return (
                            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold">{phase.phase}</h4>
                                <Badge className={statusColor}>
                                  {phase.status.charAt(0).toUpperCase() + phase.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {phase.startDate} to {phase.endDate}
                              </p>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Project Duration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Launch Date</span>
                          <span className="font-bold">{timelineMetrics.launchDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expected Completion</span>
                          <span className="font-bold">{timelineMetrics.expectedCompletionDate}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-bold">
                            {Math.ceil((new Date(timelineMetrics.expectedCompletionDate).getTime() - new Date(timelineMetrics.launchDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* General Project Info */}
        {(!project.projectType || project.projectType !== 'real-estate') && (
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="text-lg font-semibold">{project.customer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge>{project.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-lg font-semibold">{project.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="text-lg font-semibold">{project.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="text-lg font-semibold">₹{project.budget.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-lg font-semibold">₹{project.spent.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
