import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Clock3, UserCheck, UserX } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/Components/ui/dialog'
import { Textarea } from '@/Components/ui/textarea'
import { SECTION_KEYS } from '@/Components/table/sectionDefinitions'
import { selectSectionData, confirmStudentAssignment, rejectStudentAssignment } from '@/redux/slices/tableSlice'

const formatDateTime = (value) => {
  if (!value) return 'Just assigned'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const AssignmentRow = ({ assignment, onConfirm, onReject, disabled }) => {
  const {
    id,
    name,
    programme,
    assignedByName,
    assignmentAssignedAt,
    cohort,
  } = assignment

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-card via-card to-card/80 px-5 py-4 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCheck className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold text-foreground">{name || 'Unnamed student'}</span>
          </div>
          {programme ? (
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary/15 to-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              {programme}
            </span>
          ) : null}
          {cohort ? (
            <span className="inline-flex items-center rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              {cohort}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 text-primary/60" />
            <span className="font-medium">{formatDateTime(assignmentAssignedAt)}</span>
          </span>
          {assignedByName ? (
            <span className="inline-flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-500/60" />
              <span>Assigned by <span className="font-medium text-foreground">{assignedByName}</span></span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 sm:flex-shrink-0">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-white text-black hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm"
          onClick={() => onConfirm(assignment)}
          disabled={disabled}
        >
          <UserCheck className="mr-1.5 h-4 w-4" />
          Confirm
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="bg-white text-black hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all shadow-sm"
          onClick={() => onReject(assignment)}
          disabled={disabled}
        >
          <UserX className="mr-1.5 h-4 w-4 text-destructive" /> Reject
        </Button>
      </div>
    </div>
  )
}

export default function CompanyAssignmentsPanel(){
  const dispatch = useDispatch()
  const section = useSelector(selectSectionData(SECTION_KEYS.students))
  const pendingAssignments = section?.pendingAssignments || []
  const mutationPending = section?.mutationStatus === 'pending'
  const mutationError = section?.mutationError

  const [confirmTarget, setConfirmTarget] = React.useState(null)
  const [rejectTarget, setRejectTarget] = React.useState(null)
  const [rejectReason, setRejectReason] = React.useState('')

  const handleConfirm = React.useCallback(() => {
    if (!confirmTarget) return
    dispatch(confirmStudentAssignment({ id: confirmTarget.id }))
    setConfirmTarget(null)
  }, [confirmTarget, dispatch])

  const handleReject = React.useCallback(() => {
    if (!rejectTarget || !rejectReason.trim()) return
    dispatch(rejectStudentAssignment({ id: rejectTarget.id, reason: rejectReason.trim() }))
    setRejectTarget(null)
    setRejectReason('')
  }, [dispatch, rejectReason, rejectTarget])

  React.useEffect(() => {
    if (!rejectTarget) {
      setRejectReason('')
    }
  }, [rejectTarget])

  if (!pendingAssignments.length) {
    return (
      <Card className="border-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent shadow-md">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Clock3 className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-semibold">Pending Student Assignments</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-background/60 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/30">
              <UserCheck className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-2">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No students are awaiting your confirmation right now. New assignments from education managers will appear here.
            </p>
          </div>
          {mutationError ? (
            <p className="mt-3 text-sm text-destructive">
              {mutationError}
            </p>
          ) : null}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-card via-card to-card/80 border-0 shadow-lg overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        <CardHeader className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm">
                <Clock3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">Pending Student Assignments</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pendingAssignments.length} student{pendingAssignments.length !== 1 ? 's' : ''} awaiting confirmation
                </p>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {pendingAssignments.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 pb-6">
          {pendingAssignments.map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              onConfirm={setConfirmTarget}
              onReject={setRejectTarget}
              disabled={mutationPending}
            />
          ))}
          {mutationError ? (
            <div className="rounded-xl bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive font-medium">
                {mutationError}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={Boolean(confirmTarget)} onOpenChange={(open) => (!open ? setConfirmTarget(null) : null)}>
        <DialogContent className="w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Confirm student assignment?</DialogTitle>
            <DialogClose onClick={() => setConfirmTarget(null)} />
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">
              Confirming will notify the education managers that this student is verified for LIA with your company.
            </p>
          </DialogBody>
          <DialogFooter className="justify-start">
            <Button type="button" variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-white text-black hover:bg-white/80"
              onClick={handleConfirm}
              disabled={mutationPending}
            >
              Confirm assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => (!open ? setRejectTarget(null) : null)}>
        <DialogContent className="w-full max-w-md mx-auto text-left">
          <DialogHeader>
            <DialogTitle>Reject student assignment</DialogTitle>
            <DialogClose onClick={() => setRejectTarget(null)} />
          </DialogHeader>
          <DialogBody className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Please share a short note explaining why this student cannot be onboarded. The education managers will see your response.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Provide a brief explanation"
              rows={4}
            />
          </DialogBody>
          <DialogFooter className="justify-start">
            <Button type="button" variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={mutationPending || !rejectReason.trim()}
            >
              Submit rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
