import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { CheckCircle2, Mail, Loader2 } from 'lucide-react'

export default function SuccessModal({ open, onClose, title, message, isLoading = false, candidateName = '' }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 text-white border border-slate-800 max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            {isLoading ? (
              <div className="h-16 w-16 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-green-600/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            )}
          </div>
          <DialogTitle className="text-center text-xl">
            {isLoading ? 'Sending...' : title}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4 text-center">
            {!isLoading && (
              <>
                <div className="flex items-center justify-center gap-2 text-slate-300">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <p>{message}</p>
                </div>
                <p className="text-sm text-slate-400">
                  The candidate will receive an email notification and can view the offer details in their applications.
                </p>
                <Button 
                  onClick={onClose}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Done
                </Button>
              </>
            )}
            {isLoading && (
              <p className="text-slate-400">
                Sending offer letter to {candidateName}...
              </p>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
