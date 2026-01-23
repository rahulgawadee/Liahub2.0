import React from 'react'
import { useSelector } from 'react-redux'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogClose } from '@/Components/ui/dialog'
import { Label } from '@/Components/ui/label'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Upload, FileText, X } from 'lucide-react'
import { toast } from 'sonner'

export default function OfferLetterDialog({ open, onClose, onSubmit, applicant }) {
  const accessToken = useSelector((state) => state.auth.accessToken)
  const [form, setForm] = React.useState(() => ({
    startDate: '',
    compensation: '',
    note: '',
    pdfUrl: '',
  }))
  const [uploading, setUploading] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setForm({
        startDate: applicant?.offerLetter?.startDate || '',
        compensation: applicant?.offerLetter?.compensation || '',
        note: applicant?.offerLetter?.note || '',
        pdfUrl: applicant?.offerLetter?.pdfUrl || '',
      })
    }
  }, [open, applicant])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Upload to your server/cloudinary
      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed with status ${response.status}`)
      }

      const data = await response.json()
      updateField('pdfUrl', data.url)
      toast.success('PDF uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload PDF. Make sure backend is running.')
    } finally {
      setUploading(false)
    }
  }

  const removePdf = () => {
    updateField('pdfUrl', '')
    // Reset file input
    const fileInput = document.getElementById('pdf-upload')
    if (fileInput) fileInput.value = ''
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    console.log('Submitting offer with form data:', form)
    onSubmit?.({ ...form })
  }

  // Check if this is editing an existing offer
  const isEditing = applicant?.offerLetter && applicant?.status === 'offer_sent'

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose?.() }}>
      <DialogContent className="bg-slate-950 text-white border border-slate-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Offer Letter' : 'Send Offer Letter'}</DialogTitle>
          <DialogClose onClick={onClose} />
        </DialogHeader>
        <DialogBody>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="offer-start-date">Proposed start date *</Label>
              <Input
                id="offer-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => updateField('startDate', event.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-compensation">Compensation / stipend *</Label>
              <Input
                id="offer-compensation"
                placeholder="e.g. $120K + bonus"
                value={form.compensation}
                onChange={(event) => updateField('compensation', event.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pdf-upload">Offer Letter PDF (Optional)</Label>
              <div className="space-y-3">
                {form.pdfUrl ? (
                  <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-white">Offer Letter PDF</p>
                        <p className="text-xs text-slate-400">PDF attached</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={removePdf}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="pdf-upload"
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-slate-900/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-300 mb-1">
                      {uploading ? 'Uploading...' : 'Click to upload PDF'}
                    </p>
                    <p className="text-xs text-slate-500">PDF up to 5MB</p>
                    <input
                      id="pdf-upload"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Upload a formal offer letter PDF. Students will be able to download it.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="offer-note">Message to candidate</Label>
              <textarea
                id="offer-note"
                placeholder="Optional note or additional instructions..."
                value={form.note}
                onChange={(event) => updateField('note', event.target.value)}
                rows={4}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : (isEditing ? 'Update offer' : 'Send offer')}
              </Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
