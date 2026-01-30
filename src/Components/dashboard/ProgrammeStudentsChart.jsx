import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { BookOpen, Users, CheckCircle2, Clock, XCircle, AlertCircle, TrendingUp, Award } from 'lucide-react'

export default function ProgrammeStudentsChart({ studentData = [] }) {
  // Group students by programme
  const programmeData = React.useMemo(() => {
    const groups = {}
    
    studentData.forEach(student => {
      const programme = String(student.programme || student.program || 'Unassigned').trim()
      if (!groups[programme]) {
        groups[programme] = {
          name: programme,
          total: 0,
          confirmed: 0,
          pending: 0,
          rejected: 0,
          unassigned: 0
        }
      }
      
      groups[programme].total++
      const status = String(student.assignmentStatus || '').toLowerCase()
      if (status === 'confirmed') groups[programme].confirmed++
      else if (status === 'pending') groups[programme].pending++
      else if (status === 'rejected') groups[programme].rejected++
      else groups[programme].unassigned++
    })
    
    // Convert to array and sort by total students
    return Object.values(groups).sort((a, b) => b.total - a.total)
  }, [studentData])

  const totalStudents = studentData.length
  const totalConfirmed = programmeData.reduce((sum, p) => sum + p.confirmed, 0)
  const totalPending = programmeData.reduce((sum, p) => sum + p.pending, 0)
  const overallCompletionRate = totalStudents > 0 ? Math.round((totalConfirmed / totalStudents) * 100) : 0

  return (
    <Card className="bg-[#0a0a0a] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
      <CardHeader className="border-b border-white/5 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-400/20">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Student Placement Overview
              </CardTitle>
              <p className="text-xs text-white/50 mt-0.5">Programme-wise distribution and status</p>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs text-white/50">Total Students</div>
                  <div className="text-lg font-bold text-white">{totalStudents}</div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs text-white/50">Placement Rate</div>
                  <div className="text-lg font-bold text-emerald-400">{overallCompletionRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {programmeData.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-sm text-white/40">No student data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {programmeData.map((prog, index) => {
              const confirmedPercentage = prog.total > 0 ? (prog.confirmed / prog.total) * 100 : 0
              const pendingPercentage = prog.total > 0 ? (prog.pending / prog.total) * 100 : 0
              const rejectedPercentage = prog.total > 0 ? (prog.rejected / prog.total) * 100 : 0
              const unassignedPercentage = prog.total > 0 ? (prog.unassigned / prog.total) * 100 : 0

              return (
                <div key={prog.name} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-400/30 transition-all duration-300 hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)]">
                  {/* Programme Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-400/20 text-sm font-bold text-blue-400">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white">{prog.name}</h4>
                        <p className="text-xs text-white/50 mt-0.5">{prog.total} students enrolled</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">{Math.round(confirmedPercentage)}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden mb-4">
                    <div className="h-full flex">
                      {/* Confirmed */}
                      {confirmedPercentage > 0 && (
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold transition-all duration-700"
                          style={{ width: `${confirmedPercentage}%` }}
                          title={`${prog.confirmed} Confirmed`}
                        >
                          {confirmedPercentage >= 10 && prog.confirmed}
                        </div>
                      )}
                      
                      {/* Pending */}
                      {pendingPercentage > 0 && (
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-400 flex items-center justify-center text-white text-xs font-semibold transition-all duration-700"
                          style={{ width: `${pendingPercentage}%` }}
                          title={`${prog.pending} Pending`}
                        >
                          {pendingPercentage >= 10 && prog.pending}
                        </div>
                      )}
                      
                      {/* Rejected */}
                      {rejectedPercentage > 0 && (
                        <div 
                          className="bg-gradient-to-r from-red-500 to-red-400 flex items-center justify-center text-white text-xs font-semibold transition-all duration-700"
                          style={{ width: `${rejectedPercentage}%` }}
                          title={`${prog.rejected} Rejected`}
                        >
                          {rejectedPercentage >= 10 && prog.rejected}
                        </div>
                      )}
                      
                      {/* Unassigned */}
                      {unassignedPercentage > 0 && (
                        <div 
                          className="bg-gradient-to-r from-slate-500 to-slate-400 flex items-center justify-center text-white text-xs font-semibold transition-all duration-700"
                          style={{ width: `${unassignedPercentage}%` }}
                          title={`${prog.unassigned} Unassigned`}
                        >
                          {unassignedPercentage >= 10 && prog.unassigned}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {prog.confirmed > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-emerald-200/60">Confirmed</div>
                          <div className="text-sm font-bold text-emerald-400">{prog.confirmed}</div>
                        </div>
                      </div>
                    )}
                    {prog.pending > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/20">
                        <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-amber-200/60">Pending</div>
                          <div className="text-sm font-bold text-amber-400">{prog.pending}</div>
                        </div>
                      </div>
                    )}
                    {prog.rejected > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-400/20">
                        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-red-200/60">Rejected</div>
                          <div className="text-sm font-bold text-red-400">{prog.rejected}</div>
                        </div>
                      </div>
                    )}
                    {prog.unassigned > 0 && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-500/10 border border-slate-400/20">
                        <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-slate-200/60">Unassigned</div>
                          <div className="text-sm font-bold text-slate-400">{prog.unassigned}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
