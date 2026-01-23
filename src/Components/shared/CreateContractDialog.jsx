import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/Components/ui/dialog'
import SignaturePad from '@/Components/shared/SignaturePad'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import apiClient from '@/lib/apiClient'
import { FileText, Upload } from 'lucide-react'

export default function CreateContractDialog({ open, onClose, onCreated, organizationId }) {
  const [contractType, setContractType] = useState('text') // 'text' or 'pdf'
  const [contractTitle, setContractTitle] = useState('')
  const [contractContent, setContractContent] = useState('')
  const [contractFile, setContractFile] = useState(null)
  const [signature, setSignature] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setContractFile(file)
      setError(null)
    }
  }

  const handleSignature = (signatureData) => {
    setSignature(signatureData)
  }

  const handleSubmit = async () => {
    // Validation
    if (!contractTitle.trim()) {
      setError('Contract title is required')
      return
    }

    if (contractType === 'text' && !contractContent.trim()) {
      setError('Contract content is required')
      return
    }

    if (contractType === 'pdf' && !contractFile) {
      setError('Please upload a PDF contract')
      return
    }

    if (!signature) {
      setError('Your signature is required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      let contractFileUrl = null

      // Upload PDF if contract type is PDF
      if (contractType === 'pdf' && contractFile) {
        const formData = new FormData()
        formData.append('contractPdf', contractFile)

        const uploadResponse = await apiClient.post('/contracts/upload-pdf', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          },
        })

        contractFileUrl = uploadResponse.data.fileUrl
      }

      // Create contract
      const contractData = {
        organizationId: organizationId,
        contractType,
        contractContent: contractType === 'text' ? contractContent : '',
        contractFileUrl: contractType === 'pdf' ? contractFileUrl : null,
        schoolSignature: signature,
        metadata: {
          contractTitle,
        },
      }

      const response = await apiClient.post('/contracts', contractData)
      onCreated(response.data)
      handleClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create contract')
    } finally {
      setCreating(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    if (!creating) {
      setContractType('text')
      setContractTitle('')
      setContractContent('')
      setContractFile(null)
      setSignature(null)
      setError(null)
      setUploadProgress(0)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            Create New Contract
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* Contract Title */}
            <div className="space-y-2">
              <Label htmlFor="contractTitle">Contract Title *</Label>
              <Input
                id="contractTitle"
                placeholder="e.g., LIA Partnership Agreement 2024"
                value={contractTitle}
                onChange={(e) => setContractTitle(e.target.value)}
                disabled={creating}
              />
            </div>

            {/* Contract Type Selection */}
            <div className="space-y-2">
              <Label>Contract Type *</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setContractType('text')}
                  disabled={creating}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    contractType === 'text'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <FileText className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">Text Contract</p>
                  <p className="text-xs text-muted-foreground mt-1">Write contract terms directly</p>
                </button>
                <button
                  type="button"
                  onClick={() => setContractType('pdf')}
                  disabled={creating}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    contractType === 'pdf'
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <Upload className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">PDF Upload</p>
                  <p className="text-xs text-muted-foreground mt-1">Upload existing PDF contract</p>
                </button>
              </div>
            </div>

            {/* Contract Content (Text) */}
            {contractType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="contractContent">Contract Terms *</Label>
                <Textarea
                  id="contractContent"
                  placeholder="Enter the contract terms and conditions..."
                  value={contractContent}
                  onChange={(e) => setContractContent(e.target.value)}
                  disabled={creating}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter all terms and conditions that the company must agree to.
                </p>
              </div>
            )}

            {/* Contract File Upload (PDF) */}
            {contractType === 'pdf' && (
              <div className="space-y-2">
                <Label htmlFor="contractFile">Upload Contract PDF *</Label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    id="contractFile"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={creating}
                    className="hidden"
                  />
                  <label
                    htmlFor="contractFile"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    {contractFile ? (
                      <div>
                        <p className="font-medium text-sm">{contractFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-sm">Click to upload PDF</p>
                        <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Signature */}
            <div className="space-y-2">
              <Label>Your Signature (School/Institution Representative) *</Label>
              <p className="text-sm text-muted-foreground">
                Sign below to authorize this contract on behalf of your institution.
              </p>
              <SignaturePad onSave={handleSignature} disabled={creating} />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={creating}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={creating || !signature}
                className="flex-1"
              >
                {creating ? 'Creating Contract...' : 'Create Contract'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              The company will receive an email notification and must sign this contract on their first login.
            </p>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
