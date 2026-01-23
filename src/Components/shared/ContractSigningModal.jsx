import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/Components/ui/dialog'
import SignaturePad from '@/Components/shared/SignaturePad'
import { Button } from '@/Components/ui/button'
import apiClient from '@/lib/apiClient'
import { CheckCircle } from 'lucide-react'

export default function ContractSigningModal({ contract, onSigned, onClose }) {
  const [signature, setSignature] = useState(null)
  const [signing, setSigning] = useState(false)
  const [error, setError] = useState(null)

  const handleSignature = (signatureData) => {
    setSignature(signatureData)
  }

  const handleSubmit = async () => {
    if (!signature) {
      setError('Please provide your signature')
      return
    }

    setSigning(true)
    setError(null)

    try {
      const response = await apiClient.post(`/contracts/${contract.id}/sign`, {
        companySignature: signature,
      })
      onSigned(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign contract')
    } finally {
      setSigning(false)
    }
  }

  if (!contract) return null

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="h-6 w-6 text-primary" />
            Contract Signature Required
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* Contract Information */}
            <div className="rounded-lg bg-muted/30 p-4">
              <h3 className="font-semibold mb-2">Contract Details</h3>
              <p className="text-sm text-muted-foreground">
                {contract.metadata?.contractTitle || 'Partnership Contract'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Created: {new Date(contract.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Contract Content */}
            <div className="space-y-4">
              <h3 className="font-semibold">Contract Terms</h3>
              {contract.contractType === 'pdf' && contract.contractFileUrl ? (
                <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                  <iframe
                    src={contract.contractFileUrl}
                    className="w-full h-[400px] rounded"
                    title="Contract PDF"
                  />
                  <a
                    href={contract.contractFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline mt-2 inline-block"
                  >
                    Open in new tab
                  </a>
                </div>
              ) : (
                <div className="border border-gray-600 rounded-lg p-6 bg-gray-900 max-h-[400px] overflow-y-auto">
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                    {contract.contractContent || 'No contract content available.'}
                  </div>
                </div>
              )}
            </div>

            {/* School Signature */}
            <div className="space-y-3">
              <h3 className="font-semibold">School/Institution Signature</h3>
              <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                {contract.schoolSignature ? (
                  <img
                    src={contract.schoolSignature}
                    alt="School Signature"
                    className="h-24 object-contain"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No signature</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Signed by: {contract.schoolSignedBy?.name?.first} {contract.schoolSignedBy?.name?.last}
                </p>
                <p className="text-xs text-muted-foreground">
                  Date: {new Date(contract.schoolSignedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Company Signature */}
            <div className="space-y-3">
              <h3 className="font-semibold">Your Signature (Company Representative)</h3>
              <p className="text-sm text-muted-foreground">
                By signing below, you acknowledge that you have read and agree to the terms of this contract.
              </p>
              <SignaturePad onSave={handleSignature} disabled={signing} />
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
                onClick={handleSubmit}
                disabled={!signature || signing}
                className="flex-1"
              >
                {signing ? 'Signing...' : 'Sign and Accept Contract'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Note: You must sign this contract to continue using LiaHub services.
            </p>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
