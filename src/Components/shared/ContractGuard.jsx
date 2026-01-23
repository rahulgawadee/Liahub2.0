import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import ContractSigningModal from './ContractSigningModal'
import apiClient from '@/lib/apiClient'

export default function ContractGuard({ children }) {
  const { user } = useSelector(selectAuth)
  const [pendingContract, setPendingContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    checkForPendingContract()
  }, [user])

  const checkForPendingContract = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    // Only check for company users
    const isCompany = user.roles?.some(role => 
      ['company_ceo', 'company_founder', 'company_employer', 'company_hiring_manager'].includes(role)
    )

    if (!isCompany) {
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.get('/contracts/pending')
      if (response.data && response.data.hasPendingContract) {
        setPendingContract(response.data.contract)
        setShowModal(true)
      }
    } catch (err) {
      console.error('Error checking for pending contract:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleContractSigned = (signedContract) => {
    setShowModal(false)
    setPendingContract(null)
    // Optionally show a success message or refresh user data
    window.location.reload() // Reload to update verification status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {showModal && pendingContract && (
        <ContractSigningModal
          contract={pendingContract}
          onSigned={handleContractSigned}
          onClose={() => {}} // Cannot close until signed
        />
      )}
      {children}
    </>
  )
}
