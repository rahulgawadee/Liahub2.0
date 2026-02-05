import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { BookOpen, Users, CheckCircle2, Clock, XCircle, AlertCircle, TrendingUp, Award } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'

export default function ProgrammeStudentsChart({ studentData = [] }) {
  const { isDark } = useTheme()
  
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
    <Card className={`transition-colors duration-300 ${isDark ? 'bg-[#0a0a0a] border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-white border border-gray-200 shadow-md'}`}>
      <CardHeader className={`border-b pb-4 transition-colors duration-300 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-400/20">
              <Award className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>
                Student Placement Overview
              </CardTitle>
              <p className={`text-xs mt-0.5 transition-colors duration-300 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>Programme-wise distribution and status</p>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>Total Students</div>
                  <div className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{totalStudents}</div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>Placement Rate</div>
                  <div className={`text-lg font-bold transition-colors duration-300 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{overallCompletionRate}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {programmeData.length === 0 ? (
          <div className="py-16 text-center">
            <BookOpen className={`w-12 h-12 mx-auto mb-3 transition-colors duration-300 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
            <p className={`text-sm transition-colors duration-300 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>No student data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {programmeData.map((prog, index) => {
              const confirmedPercentage = prog.total > 0 ? (prog.confirmed / prog.total) * 100 : 0
              const pendingPercentage = prog.total > 0 ? (prog.pending / prog.total) * 100 : 0
              const rejectedPercentage = prog.total > 0 ? (prog.rejected / prog.total) * 100 : 0
              const unassignedPercentage = prog.total > 0 ? (prog.unassigned / prog.total) * 100 : 0

              return (
                <div key={prog.name} className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-md ${isDark ? 'bg-white/5 border-white/10 hover:border-blue-400/30 hover:shadow-[0_8px_24px_rgba(59,130,246,0.15)]' : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:shadow-lg'}`}>
                  {/* Programme Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-400/20 text-sm font-bold text-blue-400">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className={`font-bold text-base transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{prog.name}</h4>
                        <p className={`text-xs mt-0.5 transition-colors duration-300 ${isDark ? 'text-white/50' : 'text-gray-600'}`}>{prog.total} students enrolled</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">{Math.round(confirmedPercentage)}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className={`relative h-8 rounded-lg border overflow-hidden mb-4 transition-colors duration-300 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
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
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-300 ${isDark ? 'bg-emerald-500/10 border-emerald-400/20' : 'bg-emerald-50 border-emerald-200'}`}>
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <div className="min-w-0">
                          <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-emerald-200/60' : 'text-emerald-700'}`}>Confirmed</div>
                          <div className={`text-sm font-bold transition-colors duration-300 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{prog.confirmed}</div>
                        </div>
                      </div>
                    )}
                    {prog.pending > 0 && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-300 ${isDark ? 'bg-amber-500/10 border-amber-400/20' : 'bg-amber-50 border-amber-200'}`}>
                        <Clock className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                        <div className="min-w-0">
                          <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-amber-200/60' : 'text-amber-700'}`}>Pending</div>
                          <div className={`text-sm font-bold transition-colors duration-300 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{prog.pending}</div>
                        </div>
                      </div>
                    )}
                    {prog.rejected > 0 && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-300 ${isDark ? 'bg-red-500/10 border-red-400/20' : 'bg-red-50 border-red-200'}`}>
                        <XCircle className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                        <div className="min-w-0">
                          <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-red-200/60' : 'text-red-700'}`}>Rejected</div>
                          <div className={`text-sm font-bold transition-colors duration-300 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{prog.rejected}</div>
                        </div>
                      </div>
                    )}
                    {prog.unassigned > 0 && (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors duration-300 ${isDark ? 'bg-slate-500/10 border-slate-400/20' : 'bg-slate-50 border-slate-200'}`}>
                        <AlertCircle className={`w-4 h-4 flex-shrink-0 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`} />
                        <div className="min-w-0">
                          <div className={`text-xs transition-colors duration-300 ${isDark ? 'text-slate-200/60' : 'text-slate-700'}`}>Unassigned</div>
                          <div className={`text-sm font-bold transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{prog.unassigned}</div>
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
