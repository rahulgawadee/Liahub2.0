import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../redux/slices/authSlice';
import apiClient from '../../lib/apiClient';
import { Button } from '../../Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../Components/ui/card';
import { Input } from '../../Components/ui/input';
import { Label } from '../../Components/ui/label';
import { SidebarProvider } from '../../Components/ui/sidebar';
import { AppSidebar } from '../../Components/sidebar/app-sidebar';
import { SiteHeader } from '../../Components/sidebar/site-header';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateEditJob() {
  const { jobId } = useParams(); // If jobId exists, we're editing
  const navigate = useNavigate();
  const { user, accessToken } = useSelector(selectAuth);
  const [loading, setLoading] = useState(false);
  const [fetchingJob, setFetchingJob] = useState(!!jobId);
  const [companies, setCompanies] = useState([]); // Available companies
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // Check if user is from school
  const isSchool = user?.roles?.some(r => ['school_admin', 'school_education_manager', 'school_teacher'].includes(r));

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'job', // job, internship, lia
    location: '',
    employmentType: '', // Full-time, Part-time, Contract
    locationType: '', // Remote, On-site, Hybrid
    salary: '',
    deadline: '',
    openings: 1,
    seniority: '', // Junior, Mid, Senior
    duration: '', // For LIA/Internship
    mentor: '', // For LIA
    supervisor: '', // For LIA
    tags: [],
    requirements: [],
    responsibilities: [],
    benefits: [],
    learningGoals: [], // For LIA
    support: [], // For LIA
    companyId: '', // Company organization ID (for schools)
  });

  const [tagInput, setTagInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');
  const [responsibilityInput, setResponsibilityInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [learningGoalInput, setLearningGoalInput] = useState('');
  const [supportInput, setSupportInput] = useState('');

  // Fetch companies when component mounts (for schools only)
  useEffect(() => {
    if (isSchool && accessToken) {
      fetchCompanies();
    }
  }, [isSchool, accessToken]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const response = await apiClient.get('/api/v1/organizations/companies', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setCompanies(response.data.companies || []);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setFetchingJob(true);
      const response = await apiClient.get(`/jobs/${jobId}`);
      const job = response.data.job;
      
      setFormData({
        title: job.title || '',
        description: job.description || '',
        type: job.type || 'job',
        location: job.location || '',
        employmentType: job.employmentType || '',
        locationType: job.locationType || '',
        salary: job.salary || '',
        deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
        openings: job.openings || 1,
        seniority: job.seniority || '',
        duration: job.duration || '',
        mentor: job.mentor || '',
        supervisor: job.supervisor || '',
        tags: job.tags || [],
        requirements: job.requirements || [],
        responsibilities: job.responsibilities || [],
        benefits: job.benefits || [],
        learningGoals: job.learningGoals || [],
        support: job.support || [],
        companyId: job.organization?._id || job.organization || '', // Get company ID
      });
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setFetchingJob(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addToArray = (arrayName, input, setInput) => {
    if (input.trim()) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: [...prev[arrayName], input.trim()]
      }));
      setInput('');
    }
  };

  const removeFromArray = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validation for schools: must select a company
    if (isSchool && !formData.companyId) {
      toast.error('Please select a company for this job posting');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        // Schools: use selected company. Companies: use their own organization
        organization: isSchool ? formData.companyId : (user?.currentOrganization?._id || user?.currentOrganization)
      };
      
      // Remove companyId from payload (it's not part of job schema)
      delete payload.companyId;

      if (jobId) {
        // Update existing job
        await apiClient.put(`/jobs/${jobId}`, payload);
        toast.success('Job updated successfully!');
      } else {
        // Create new job
        await apiClient.post('/jobs', payload);
        toast.success('Job posted successfully!');
      }

      // Navigate back based on user role
      if (user?.roles?.some(r => ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(r))) {
        navigate('/company/jobs');
      } else {
        navigate('/school/jobs');
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error(error.response?.data?.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingJob) {
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
                  <p className="mt-4 text-muted-foreground">Loading job details...</p>
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
          <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">
                  {jobId ? 'Edit Job Posting' : 'Post New Job'}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {jobId ? 'Update your job posting details' : 'Fill in the details to create a new job posting'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Provide the essential details about this position</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Full Stack Developer"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Type *</Label>
                    <select
                      id="type"
                      name="type"
                      className="w-full p-2 border rounded-md"
                      value={formData.type}
                      onChange={handleChange}
                      required
                    >
                      <option value="job">Job</option>
                      <option value="internship">Internship</option>
                      <option value="lia">LIA (Learning in Arbeitslivet)</option>
                    </select>
                  </div>

                  {/* Company Selection - Only for Schools */}
                  {isSchool && (
                    <div className="space-y-2">
                      <Label htmlFor="companyId">Company *</Label>
                      <select
                        id="companyId"
                        name="companyId"
                        className="w-full p-2 border rounded-md"
                        value={formData.companyId}
                        onChange={handleChange}
                        required
                        disabled={loadingCompanies}
                      >
                        <option value="">
                          {loadingCompanies ? 'Loading companies...' : 'Select a company'}
                        </option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-muted-foreground">
                        Select which company this job posting is for. Applications will be sent to this company.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <textarea
                      id="description"
                      name="description"
                      className="w-full p-2 border rounded-md"
                      rows="6"
                      placeholder="Describe the role, expectations, and what makes this opportunity exciting..."
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="e.g., San Francisco, CA"
                        value={formData.location}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary">Salary Range</Label>
                      <Input
                        id="salary"
                        name="salary"
                        placeholder="e.g., $120K - $150K per year"
                        value={formData.salary}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <select
                        id="employmentType"
                        name="employmentType"
                        className="w-full p-2 border rounded-md"
                        value={formData.employmentType}
                        onChange={handleChange}
                      >
                        <option value="">Select Type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="locationType">Location Type</Label>
                      <select
                        id="locationType"
                        name="locationType"
                        className="w-full p-2 border rounded-md"
                        value={formData.locationType}
                        onChange={handleChange}
                      >
                        <option value="">Select Type</option>
                        <option value="On-site">On-site</option>
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seniority">Seniority Level</Label>
                      <select
                        id="seniority"
                        name="seniority"
                        className="w-full p-2 border rounded-md"
                        value={formData.seniority}
                        onChange={handleChange}
                      >
                        <option value="">Select Level</option>
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Application Deadline</Label>
                      <Input
                        id="deadline"
                        name="deadline"
                        type="date"
                        value={formData.deadline}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="openings">Number of Openings</Label>
                      <Input
                        id="openings"
                        name="openings"
                        type="number"
                        min="1"
                        value={formData.openings}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* LIA Specific Fields */}
              {formData.type === 'lia' && (
                <Card>
                  <CardHeader>
                    <CardTitle>LIA Specific Information</CardTitle>
                    <CardDescription>Additional details for Learning in Arbeitslivet programs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          name="duration"
                          placeholder="e.g., 6 months"
                          value={formData.duration}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mentor">Mentor Name</Label>
                        <Input
                          id="mentor"
                          name="mentor"
                          placeholder="Name of assigned mentor"
                          value={formData.mentor}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="supervisor">Supervisor Name</Label>
                        <Input
                          id="supervisor"
                          name="supervisor"
                          placeholder="Name of supervisor"
                          value={formData.supervisor}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Learning Goals</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a learning goal and press Enter"
                          value={learningGoalInput}
                          onChange={(e) => setLearningGoalInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('learningGoals', learningGoalInput, setLearningGoalInput);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addToArray('learningGoals', learningGoalInput, setLearningGoalInput)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.learningGoals.map((goal, index) => (
                          <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md text-sm">
                            {goal}
                            <button type="button" onClick={() => removeFromArray('learningGoals', index)}>
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Support Provided</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add support detail and press Enter"
                          value={supportInput}
                          onChange={(e) => setSupportInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addToArray('support', supportInput, setSupportInput);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addToArray('support', supportInput, setSupportInput)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.support.map((item, index) => (
                          <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md text-sm">
                            {item}
                            <button type="button" onClick={() => removeFromArray('support', index)}>
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Requirements and Responsibilities */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements & Responsibilities</CardTitle>
                  <CardDescription>Define what you're looking for and what the role entails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Requirements</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a requirement and press Enter"
                        value={requirementInput}
                        onChange={(e) => setRequirementInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('requirements', requirementInput, setRequirementInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addToArray('requirements', requirementInput, setRequirementInput)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.requirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md text-sm">
                          {req}
                          <button type="button" onClick={() => removeFromArray('requirements', index)}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Responsibilities</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a responsibility and press Enter"
                        value={responsibilityInput}
                        onChange={(e) => setResponsibilityInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('responsibilities', responsibilityInput, setResponsibilityInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addToArray('responsibilities', responsibilityInput, setResponsibilityInput)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.responsibilities.map((resp, index) => (
                        <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md text-sm">
                          {resp}
                          <button type="button" onClick={() => removeFromArray('responsibilities', index)}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits and Tags */}
              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Tags</CardTitle>
                  <CardDescription>Highlight what makes this opportunity attractive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Benefits</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a benefit and press Enter"
                        value={benefitInput}
                        onChange={(e) => setBenefitInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('benefits', benefitInput, setBenefitInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addToArray('benefits', benefitInput, setBenefitInput)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md text-sm">
                          {benefit}
                          <button type="button" onClick={() => removeFromArray('benefits', index)}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tags / Skills</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag and press Enter"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addToArray('tags', tagInput, setTagInput);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addToArray('tags', tagInput, setTagInput)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag, index) => (
                        <div key={index} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm">
                          {tag}
                          <button type="button" onClick={() => removeFromArray('tags', index)}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : jobId ? 'Update Job' : 'Post Job'}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
