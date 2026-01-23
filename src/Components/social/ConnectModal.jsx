import React, { useEffect, useState } from 'react'
import { Button } from '@/Components/ui/button'
import { useDispatch } from 'react-redux'
import { sendConnectionRequest } from '@/redux/slices/connectionsSlice'
import { pushNotification } from '@/redux/slices/notificationsSlice'

export default function ConnectModal({ open, onClose, employer }){
  const dispatch = useDispatch()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (open) {
      setMessage('')
      setSent(false)
      setSending(false)
    }
  }, [open, employer])

  if (!open || !employer) return null

  const onSend = async () => {
    if (sending) return
    setSending(true)
    try {
      await dispatch(sendConnectionRequest({ recipientId: employer.id, message })).unwrap()
      dispatch(pushNotification({ type: 'invite', text: `Invitation sent to ${employer.name}`, userId: employer.id }))
      setSent(true)
    } catch (err) {
      dispatch(pushNotification({ type: 'error', text: err?.message || 'Failed to send' }))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-card shadow-lg p-6">
        {sent ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Invitation sent</h3>
              <button className="text-sm text-muted-foreground" onClick={onClose}>✕</button>
            </div>
            <p className="text-sm text-muted-foreground">
              Your invitation and message were sent to {employer.name}. You will be notified once they respond.
            </p>
            <div className="flex justify-end">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Connection request</h3>
              <button className="text-sm text-muted-foreground" onClick={onClose}>✕</button>
            </div>

            <textarea
              className="w-full rounded border p-3 h-32 mb-4"
              placeholder="Send a message to the employer"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sending}
            />

            <div className="flex gap-3 mb-4">
              <Button variant="outline" disabled={sending}>Record audio</Button>
              <Button variant="outline" disabled={sending}>Upload files</Button>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} disabled={sending}>Cancel</Button>
              <Button onClick={onSend} disabled={sending}>
                {sending ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
