import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { applyToJob } from '@/redux/slices/jobsSlice'
import { selectAuth } from '@/redux/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { Textarea } from '@/Components/ui/textarea'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Loader2, Upload, FileText, User, Building } from 'lucide-react'
import { toast } from 'sonner'

export default function JobApplicationModal({ open, onClose, job, onSuccess }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector(selectAuth)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    coverLetter: '',
    resumeUrl: '',
    additionalInfo: '',
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.coverLetter.trim()) {
      toast.error('Please provide a cover letter')
      return
    }

    setLoading(true)
    try {
      await dispatch(applyToJob({
        jobId: job.id,
        coverLetter: formData.coverLetter,
        resumeUrl: formData.resumeUrl || undefined,
        additionalInfo: formData.additionalInfo || undefined,
      })).unwrap()

      toast.success('✓ Application submitted successfully! Redirecting to My Applications...')
      
      // Reset form
      setFormData({
        coverLetter: '',
        resumeUrl: '',
        additionalInfo: '',
      })
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
      
      // Close modal
      onClose()
      
      // Navigate to My Applications page after a short delay
      setTimeout(() => {
        navigate('/student/applications')
      }, 1000)
    } catch (error) {
      console.error('Application submission failed:', error)
      toast.error(error || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setFormData({
        coverLetter: '',
        resumeUrl: '',
        additionalInfo: '',
      })
    }
  }

  if (!job) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-950 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-400" />
            Apply for {job.title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Submit your application for this position at {job.company}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Building className="h-5 w-5 text-blue-400 mt-1" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-white">{job.title}</h3>
                <p className="text-sm text-slate-400">{job.company}</p>
                <p className="text-sm text-slate-400">{job.location}</p>
              </div>
            </div>
          </div>

          {/* Applicant Profile Preview */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <User className="h-5 w-5 text-green-400 mt-1" />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-white">Your Profile</h4>
                <p className="text-sm text-slate-400">
                  {user?.name?.first} {user?.name?.last} ({user?.username})
                </p>
                <p className="text-sm text-slate-400">
                  {user?.studentProfile?.major || user?.staffProfile?.department || 'Student'}
                </p>
                <p className="text-xs text-slate-500">
                  Your profile information will be shared with the employer
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="coverLetter" className="text-white font-medium">
                Cover Letter *
              </Label>
              <Textarea
                id="coverLetter"
                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                value={formData.coverLetter}
                onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                className="min-h-[120px] bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                required
              />
              <p className="text-xs text-slate-500">
                Explain your motivation and relevant experience (200-500 words recommended)
              </p>
            </div>

            {/* Resume URL */}
            <div className="space-y-2">
              <Label htmlFor="resumeUrl" className="text-white font-medium">
                Resume/CV Link
              </Label>
              <Input
                id="resumeUrl"
                type="url"
                placeholder="https://drive.google.com/... or https://linkedin.com/..."
                value={formData.resumeUrl}
                onChange={(e) => handleInputChange('resumeUrl', e.target.value)}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">
                Link to your resume, portfolio, or LinkedIn profile
              </p>
            </div>

            {/* Additional Information */}
            <div className="space-y-2">
              <Label htmlFor="additionalInfo" className="text-white font-medium">
                Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any additional information you'd like to share (availability, special requirements, etc.)"
                value={formData.additionalInfo}
                onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                className="min-h-[80px] bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.coverLetter.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}