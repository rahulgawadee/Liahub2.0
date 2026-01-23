import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../redux/slices/authSlice';
import apiClient from '../../lib/apiClient';
import { Button } from '../../Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../Components/ui/card';
import { Badge } from '../../Components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../Components/ui/dialog';
import { Input } from '../../Components/ui/input';
import { Label } from '../../Components/ui/label';
import { Separator } from '../../Components/ui/separator';
import { SidebarProvider } from '../../Components/ui/sidebar';
import { AppSidebar } from '../../Components/sidebar/app-sidebar';
import { SiteHeader } from '../../Components/sidebar/site-header';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Briefcase, 
  AlertCircle,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function SchoolJobManagement() {
  const navigate = useNavigate();
  const { user } = useSelector(selectAuth);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, job, internship, lia
  const [filterStatus, setFilterStatus] = useState('all'); // all, open, closed, hiring_stopped

  // Check if user has permission to manage jobs
  const canManageJobs = user?.roles?.some(role => 
    ['school_admin', 'education_manager', 'university_admin', 'university_manager'].includes(role)
  );

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Fetch jobs created by this organization
      const response = await apiClient.get('/jobs', {
        params: {
          organization: user?.currentOrganization?._id || user?.currentOrganization,
          includeStats: true
        }
      });
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;

    try {
      await apiClient.delete(`/jobs/${jobId}`);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error(error.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleViewApplications = (jobId) => {
    navigate(`/school/jobs/${jobId}/applications`);
  };

  const handleEditJob = (jobId) => {
    navigate(`/school/jobs/${jobId}/edit`);
  };

  const filteredJobs = jobs.filter(job => {
    if (filterType !== 'all' && job.type !== filterType) return false;
    if (filterStatus !== 'all' && job.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-green-50 text-green-700 border-green-200',
      closed: 'bg-gray-50 text-gray-700 border-gray-200',
      hiring_stopped: 'bg-red-50 text-red-700 border-red-200',
      paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      draft: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colors[status] || 'bg-gray-50 text-gray-700';
  };

  const getTypeColor = (type) => {
    const colors = {
      job: 'bg-purple-50 text-purple-700',
      internship: 'bg-blue-50 text-blue-700',
      lia: 'bg-indigo-50 text-indigo-700'
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  const formatDate = (date) => {
    if (!date) return 'No deadline';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <SiteHeader />
            <div className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading jobs...</p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <SiteHeader />
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Job Management</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your job postings and view applications
                </p>
              </div>
              {canManageJobs && (
                <Button onClick={() => navigate('/school/jobs/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </Button>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Jobs</CardDescription>
                  <CardTitle className="text-3xl">{jobs.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    <Briefcase className="h-4 w-4 inline mr-1" />
                    All postings
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Active Jobs</CardDescription>
                  <CardTitle className="text-3xl text-green-600">
                    {jobs.filter(j => j.status === 'open').length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Currently hiring
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Total Applications</CardDescription>
                  <CardTitle className="text-3xl text-blue-600">
                    {jobs.reduce((sum, job) => sum + (job.applicantsCount || 0), 0)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    <Users className="h-4 w-4 inline mr-1" />
                    All applicants
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>LIA Programs</CardDescription>
                  <CardTitle className="text-3xl text-indigo-600">
                    {jobs.filter(j => j.type === 'lia').length}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    <Briefcase className="h-4 w-4 inline mr-1" />
                    Learning opportunities
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex gap-2">
                    <Label className="self-center">Type:</Label>
                    <Button
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterType === 'job' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('job')}
                    >
                      Jobs
                    </Button>
                    <Button
                      variant={filterType === 'internship' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('internship')}
                    >
                      Internships
                    </Button>
                    <Button
                      variant={filterType === 'lia' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterType('lia')}
                    >
                      LIA
                    </Button>
                  </div>

                  <Separator orientation="vertical" className="h-8" />

                  <div className="flex gap-2">
                    <Label className="self-center">Status:</Label>
                    <Button
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterStatus === 'open' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('open')}
                    >
                      Open
                    </Button>
                    <Button
                      variant={filterStatus === 'closed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('closed')}
                    >
                      Closed
                    </Button>
                    <Button
                      variant={filterStatus === 'hiring_stopped' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterStatus('hiring_stopped')}
                    >
                      Stopped
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No jobs found</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {canManageJobs 
                        ? "Get started by posting your first job"
                        : "No jobs match your filters"}
                    </p>
                    {canManageJobs && (
                      <Button onClick={() => navigate('/school/jobs/create')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Post New Job
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job.id || job._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{job.title}</CardTitle>
                            <Badge className={getTypeColor(job.type)}>
                              {job.type?.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status?.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <CardDescription className="text-base">
                            {job.description?.substring(0, 150)}
                            {job.description?.length > 150 && '...'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Job Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2" />
                            {job.location || 'Location not specified'}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <DollarSign className="h-4 w-4 mr-2" />
                            {job.salary || 'Salary not specified'}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            Deadline: {formatDate(job.deadline)}
                          </div>
                        </div>

                        {/* Tags */}
                        {job.tags && job.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-6 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <span className="font-semibold">{job.applicantsCount || 0}</span>
                            <span className="text-sm text-muted-foreground">Applicants</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Posted {new Date(job.postedOn || job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="default"
                            onClick={() => handleViewApplications(job.id || job._id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Applications
                          </Button>
                          {canManageJobs && (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => handleEditJob(job.id || job._id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteJob(job.id || job._id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
