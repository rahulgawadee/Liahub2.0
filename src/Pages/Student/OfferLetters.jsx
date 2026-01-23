import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import { SidebarProvider, SidebarInset } from '@/Components/ui/sidebar'
import { AppSidebar } from '@/Components/sidebar/app-sidebar'
import { SiteHeader } from '@/Components/sidebar/site-header'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import {
  Mail,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Loader2,
  PartyPopper,
  FileText,
  Sparkles,
  Download
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getImageUrl } from '@/lib/imageUtils'
import { toast } from 'sonner'

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

const OfferCard = ({ application, onAccept }) => {
  const job = application.job
  const offer = application.offerLetter
  const [accepting, setAccepting] = useState(false)

  const handleAccept = async () => {
    setAccepting(true)
    try {
      await apiClient.post(`/jobs/applications/${application.id}/accept-offer`)
      toast.success('🎉 Congratulations! Offer accepted successfully!')
      onAccept()
    } catch (error) {
      console.error('Failed to accept offer:', error)
      toast.error(error.response?.data?.message || 'Failed to accept offer')
    } finally {
      setAccepting(false)
    }
  }

  const isAccepted = !!offer.acceptedOn

  return (
    <div className={`rounded-xl border-2 p-6 transition-all ${
      isAccepted 
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-300 dark:border-green-700' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-300 dark:border-blue-700 shadow-lg hover:shadow-xl'
    }`}>
      {/* Header with Company Logo */}
      <div className="flex items-start gap-4 mb-6">
        <div className="h-16 w-16 rounded-xl bg-background/80 flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-md">
          {job.organization?.logo ? (
            <img 
              src={getImageUrl(job.organization.logo)} 
              alt={job.organization.name}
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <Building2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-xl mb-1">{job.title}</h3>
              <p className="text-muted-foreground font-medium">{job.organization?.name}</p>
            </div>
            {isAccepted ? (
              <Badge className="bg-green-600 text-white text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Accepted
              </Badge>
            ) : (
              <Badge className="bg-yellow-600 text-white text-sm animate-pulse">
                <Sparkles className="h-4 w-4 mr-1" />
                New Offer
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Offer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <p className="text-xs font-medium uppercase">Start Date</p>
          </div>
          <p className="font-bold text-lg">{formatDate(offer.startDate)}</p>
        </div>
        
        <div className="p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <p className="text-xs font-medium uppercase">Compensation</p>
          </div>
          <p className="font-bold text-lg">{offer.compensation}</p>
        </div>
      </div>

      {/* Received Date */}
      <div className="mb-4 p-3 bg-white/50 dark:bg-slate-900/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="h-4 w-4" />
          <span>Offer received on {formatDate(offer.sentOn)}</span>
        </div>
      </div>

      {/* Additional Notes */}
      {offer.note && (
        <div className="mb-4 p-4 bg-white dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase text-muted-foreground">Additional Notes</p>
          </div>
          <p className="text-sm">{offer.note}</p>
        </div>
      )}

      {/* PDF Download */}
      {offer.pdfUrl && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border-2 border-blue-300 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-blue-700 dark:text-blue-300">Official Offer Letter</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">PDF Document</p>
              </div>
            </div>
            <Button
              onClick={() => window.open(offer.pdfUrl, '_blank')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Action or Accepted Status */}
      {isAccepted ? (
        <div className="flex items-center gap-3 p-4 bg-green-100 dark:bg-green-900/50 rounded-lg border-2 border-green-300 dark:border-green-700">
          <PartyPopper className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-green-700 dark:text-green-300">
              Accepted on {formatDate(offer.acceptedOn)}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              The company has been notified. They will contact you soon!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Action Required:</strong> Review the offer carefully. Once accepted, the company will be notified immediately.
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleAccept}
              disabled={accepting}
              size="lg" 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg py-6"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Accept Offer
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OfferLetters() {
  const { user } = useSelector(selectAuth)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/jobs/my/applications', {
        params: {
          status: 'offer_sent,offer_accepted',
          limit: 100,
        }
      })

      if (response.data) {
        // Filter to only show applications with offer letters
        const offersOnly = (response.data.items || []).filter(
          app => app.offerLetter && app.offerLetter.sentOn
        )
        setApplications(offersOnly)
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error)
      toast.error('Failed to load offer letters')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOffers()
  }, [])

  const pendingOffers = applications.filter(app => !app.offerLetter.acceptedOn)
  const acceptedOffers = applications.filter(app => app.offerLetter.acceptedOn)

  return (
    <SidebarProvider className="flex flex-col">
      <SiteHeader />
      <div className="flex flex-1 min-h-0">
        <AppSidebar />
        <SidebarInset className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Mail className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                <h1 className="text-4xl font-bold">Offer Letters</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                All your job offers in one place
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <Mail className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-semibold mb-2">No offer letters yet</h3>
                <p className="text-muted-foreground text-lg">
                  When companies send you offer letters, they'll appear here
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Pending Offers */}
                {pendingOffers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Clock className="h-6 w-6 text-yellow-600" />
                      <h2 className="text-2xl font-bold">
                        Pending Offers ({pendingOffers.length})
                      </h2>
                    </div>
                    <div className="grid gap-6">
                      {pendingOffers.map((application) => (
                        <OfferCard
                          key={application.id}
                          application={application}
                          onAccept={fetchOffers}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Accepted Offers */}
                {acceptedOffers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <h2 className="text-2xl font-bold">
                        Accepted Offers ({acceptedOffers.length})
                      </h2>
                    </div>
                    <div className="grid gap-6">
                      {acceptedOffers.map((application) => (
                        <OfferCard
                          key={application.id}
                          application={application}
                          onAccept={fetchOffers}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
