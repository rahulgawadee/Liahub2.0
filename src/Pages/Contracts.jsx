import React, { useState, useEffect } from 'react'
import { FileText, Download, CheckCircle, Clock, AlertCircle, Edit2, Save } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { Button } from '@/Components/ui/button'
import SignaturePad from '@/Components/shared/SignaturePad'
import { useSelector } from 'react-redux'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'

export default function Contracts() {
  const [template, setTemplate] = useState(null)
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedContract, setSelectedContract] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const user = useSelector((state) => state.auth.user)
  const isEducationStaff = user?.roles?.some(role => 
    ['education_manager', 'admin', 'teacher'].includes(role)
  )
  const isCompany = user?.roles?.some(role => 
    ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo'].includes(role)
  )

  // Form state for template
  const [formData, setFormData] = useState({
    contractType: 'text',
    contractContent: '',
    contractFileUrl: '',
    title: 'Company Partnership Agreement',
    description: '',
    schoolSignature: '',
  })
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSignaturePad, setShowSignaturePad] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (isEducationStaff) {
        // Fetch template
        const templateRes = await apiClient.get('/contracts/template/active')
        if (templateRes.data.template) {
          setTemplate(templateRes.data.template)
          setFormData({
            contractType: templateRes.data.template.contractType,
            contractContent: templateRes.data.template.contractContent || '',
            contractFileUrl: templateRes.data.template.contractFileUrl || '',
            title: templateRes.data.template.title,
            description: templateRes.data.template.description || '',
            schoolSignature: templateRes.data.template.schoolSignature,
          })
        }
      }
      
      // Fetch all contracts
      const contractsRes = await apiClient.get('/contracts')
      setContracts(contractsRes.data)
      
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      if (!formData.schoolSignature) {
        alert('Please add your signature')
        return
      }

      setSaving(true)
      await apiClient.post('/contracts/template', formData)
      
      alert('Template saved successfully! This will be automatically sent to all new companies.')
      setEditMode(false)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    const formDataUpload = new FormData()
    formDataUpload.append('contractPdf', file)

    try {
      const response = await apiClient.post('/contracts/upload-pdf', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percentCompleted)
        },
      })

      setFormData(prev => ({
        ...prev,
        contractFileUrl: response.data.fileUrl,
      }))
      setUploadProgress(0)
    } catch (err) {
      alert('Failed to upload file')
      setUploadProgress(0)
    }
  }

  const handleDownloadContract = async (contractId) => {
    try {
      const response = await apiClient.get(`/contracts/${contractId}/download`)
      
      if (response.data.type === 'pdf') {
        // For PDF, open in new tab or download
        window.open(response.data.url, '_blank')
      } else {
        // For text contracts, create a downloadable text file or PDF
        const contractData = response.data
        let content = `${contractData.title}\n\n`
        content += `Organization: ${contractData.organization}\n`
        content += `Date: ${new Date(contractData.createdAt).toLocaleDateString()}\n\n`
        content += `CONTRACT TERMS:\n${contractData.content}\n\n`
        content += `\n\nSIGNATURES:\n\n`
        content += `School Representative: ${contractData.schoolSignedBy}\n`
        content += `Signed: ${new Date(contractData.schoolSignedAt).toLocaleDateString()}\n\n`
        if (contractData.companySignedBy) {
          content += `Company Representative: ${contractData.companySignedBy}\n`
          content += `Signed: ${new Date(contractData.companySignedAt).toLocaleDateString()}\n`
        }

        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contract_${contractId}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      alert('Failed to download contract')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'signed':
        return 'Signed'
      case 'pending':
        return 'Pending Signature'
      case 'expired':
        return 'Expired'
      default:
        return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed':
        return 'text-green-500 bg-green-500/10'
      case 'pending':
        return 'text-yellow-500 bg-yellow-500/10'
      case 'expired':
        return 'text-red-500 bg-red-500/10'
      default:
        return 'text-gray-500 bg-gray-500/10'
    }
  }

  const getEmployerRole = (user) => {
    if (!user || !user.roles) return 'Employer';
    
    const roleMap = {
      'company_ceo': 'CEO',
      'company_founder': 'Founder',
      'company_hiring_manager': 'Hiring Manager',
      'company_employer': 'Employer'
    };
    
    // Return the highest priority role found
    const priorityOrder = ['company_ceo', 'company_founder', 'company_hiring_manager', 'company_employer'];
    
    for (const role of priorityOrder) {
      if (user.roles.includes(role)) {
        return roleMap[role];
      }
    }
    
    return 'Employer';
  };

  if (loading) {
    return (
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading contracts...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1 min-h-0">
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-auto">
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchData} className="mt-4">
                  Try Again
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                Contracts
              </h1>
              <p className="text-muted-foreground mt-2">
                {isEducationStaff 
                  ? 'Manage your contract template - automatically sent to all new companies'
                  : 'View and manage partnership contracts'}
              </p>
            </div>

      {/* Template Editor for Education Staff */}
      {isEducationStaff && (
        <div className="mb-8 border border-gray-600 rounded-lg p-6 bg-gray-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Master Contract Template</h2>
              <p className="text-sm text-muted-foreground mt-1">
                This template is automatically sent to all newly created companies
              </p>
            </div>
            {!editMode && template && (
              <Button onClick={() => setEditMode(true)} variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            )}
          </div>

          {editMode || !template ? (
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Contract Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Company Partnership Agreement"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Brief description of the contract"
                />
              </div>

              {/* Contract Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Contract Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="text"
                      checked={formData.contractType === 'text'}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
                      className="text-primary"
                    />
                    <span>Text Contract</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="pdf"
                      checked={formData.contractType === 'pdf'}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
                      className="text-primary"
                    />
                    <span>PDF Upload</span>
                  </label>
                </div>
              </div>

              {/* Contract Content */}
              {formData.contractType === 'text' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Contract Terms</label>
                  <textarea
                    value={formData.contractContent}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractContent: e.target.value }))}
                    rows={12}
                    className="w-full px-4 py-3 bg-background border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
                    placeholder="Enter the contract terms and conditions..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Upload PDF Contract</label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="w-full px-4 py-2 bg-background border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                  {formData.contractFileUrl && (
                    <p className="text-sm text-green-500 mt-2">✓ PDF uploaded successfully</p>
                  )}
                </div>
              )}

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Signature</label>
                {formData.schoolSignature ? (
                  <div className="border border-gray-600 rounded-lg p-4 bg-background">
                    <img
                      src={formData.schoolSignature}
                      alt="School Signature"
                      className="h-24 object-contain mb-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, schoolSignature: '' }))
                        setShowSignaturePad(true)
                      }}
                    >
                      Change Signature
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowSignaturePad(true)}>
                    Add Signature
                  </Button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleSaveTemplate} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : template ? 'Update Template' : 'Save Template'}
                </Button>
                {template && editMode && (
                  <Button variant="outline" onClick={() => {
                    setEditMode(false)
                    setFormData({
                      contractType: template.contractType,
                      contractContent: template.contractContent || '',
                      contractFileUrl: template.contractFileUrl || '',
                      title: template.title,
                      description: template.description || '',
                      schoolSignature: template.schoolSignature,
                    })
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Template Preview
            <div className="space-y-4">
              <div className="border border-gray-600 rounded-lg p-6 bg-background">
                <h3 className="font-semibold text-lg mb-4">{template.title}</h3>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                )}
                
                {template.contractType === 'pdf' && template.contractFileUrl ? (
                  <div className="mb-4">
                    <a
                      href={template.contractFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View PDF Contract
                    </a>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm mb-4 max-h-64 overflow-y-auto p-4 bg-gray-950 rounded">
                    {template.contractContent}
                  </div>
                )}

                <div className="border-t border-gray-600 pt-4 mt-4">
                  <p className="text-sm font-medium mb-2">Pre-Signed By:</p>
                  <img
                    src={template.schoolSignature}
                    alt="School Signature"
                    className="h-20 object-contain"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Version {template.version} • Last updated {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-gray-600 rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Add Your Signature</h3>
            <SignaturePad
              onSave={(signature) => {
                setFormData(prev => ({ ...prev, schoolSignature: signature }))
                setShowSignaturePad(false)
              }}
              onCancel={() => setShowSignaturePad(false)}
            />
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {isEducationStaff ? 'Sent Contracts' : 'Your Contracts'}
        </h2>
        
        {contracts.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-600 rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Contracts Found</h3>
            <p className="text-muted-foreground">
              {isEducationStaff 
                ? 'Contracts will appear here when companies are created'
                : 'You don\'t have any contracts yet.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <div
                key={contract._id}
                className="border border-gray-600 rounded-lg p-4 hover:border-primary transition-colors cursor-pointer"
                onClick={() => setSelectedContract(contract)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {contract.metadata?.companyName || 'Company'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        {getStatusText(contract.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mt-2">
                      <div>
                        <p className="font-medium text-foreground">Created</p>
                        <p>{new Date(contract.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">School Signed</p>
                        <p>{new Date(contract.schoolSignedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Company Signed</p>
                        <p>
                          {contract.companySignedAt
                            ? new Date(contract.companySignedAt).toLocaleDateString()
                            : 'Pending'}
                        </p>
                        {contract.companySignedBy && (
                          <p className="text-xs text-blue-300 mt-1">
                            by {contract.companySignedBy.name?.first} {contract.companySignedBy.name?.last}
                            <span className="ml-1 px-1 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs">
                              {getEmployerRole(contract.companySignedBy)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedContract(contract)
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedContract(null)}
        >
          <div
            className="bg-background border border-gray-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-600">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    {selectedContract.metadata?.contractTitle || 'Partnership Contract'}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(selectedContract.status)}`}>
                      {getStatusIcon(selectedContract.status)}
                      {getStatusText(selectedContract.status)}
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created: {new Date(selectedContract.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedContract(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contract Content */}
              <div>
                <h3 className="font-semibold mb-3">Contract Terms</h3>
                {selectedContract.contractType === 'pdf' && selectedContract.contractFileUrl ? (
                  <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                    <iframe
                      src={selectedContract.contractFileUrl}
                      className="w-full h-[400px] rounded"
                      title="Contract PDF"
                    />
                    <div className="flex gap-2 mt-3">
                      <a
                        href={selectedContract.contractFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open in new tab
                      </a>
                      <a
                        href={selectedContract.contractFileUrl}
                        download
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="border border-gray-600 rounded-lg p-6 bg-gray-900 max-h-[400px] overflow-y-auto">
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                      {selectedContract.contractContent || 'No contract content available.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6">
                {/* School Signature */}
                <div>
                  <h3 className="font-semibold mb-3">School Signature</h3>
                  <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                    {selectedContract.schoolSignature ? (
                      <>
                        <img
                          src={selectedContract.schoolSignature}
                          alt="School Signature"
                          className="h-24 object-contain mb-3"
                        />
                        <p className="text-xs text-muted-foreground">
                          Signed by: {selectedContract.schoolSignedBy?.name?.first}{' '}
                          {selectedContract.schoolSignedBy?.name?.last}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Date: {new Date(selectedContract.schoolSignedAt).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not signed</p>
                    )}
                  </div>
                </div>

                {/* Company Signature */}
                <div>
                  <h3 className="font-semibold mb-3">Company Signature</h3>
                  <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                    {selectedContract.companySignature ? (
                      <>
                        <img
                          src={selectedContract.companySignature}
                          alt="Company Signature"
                          className="h-24 object-contain mb-3"
                        />
                        <p className="text-xs text-muted-foreground">
                          Signed by: {selectedContract.companySignedBy?.name?.first}{' '}
                          {selectedContract.companySignedBy?.name?.last}
                          {selectedContract.companySignedBy && (
                            <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                              {getEmployerRole(selectedContract.companySignedBy)}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Date: {new Date(selectedContract.companySignedAt).toLocaleDateString()}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Pending signature</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-600 flex justify-between">
              {selectedContract.status === 'signed' && (
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadContract(selectedContract._id || selectedContract.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Contract
                </Button>
              )}
              <Button variant="outline" onClick={() => setSelectedContract(null)} className="ml-auto">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
