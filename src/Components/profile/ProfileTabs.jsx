import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { selectAuth } from '@/redux/store'
import Posts from './sections/Posts'
import About from './sections/About'
import CompanyAbout from './sections/CompanyAbout'
import Jobs from './sections/Jobs'

// Helper to check if user has company roles
const isCompanyUser = (roles = []) => {
  const companyRoles = ['company_employer', 'company_hiring_manager', 'company_founder', 'company_ceo']
  return roles.some(role => companyRoles.includes(role))
}

export default function ProfileTabs(){
	const { user } = useSelector(selectAuth)
	const isCompany = isCompanyUser(user?.roles)
	
	// Different tabs for company vs other users (Documents & Highlights removed)
	const tabs = isCompany 
		? ['Posts', 'About']
		: ['Posts', 'About']
	
	const [active, setActive] = useState(tabs[0])
	
	return (
		<div className="mt-4">
		<div className="flex justify-center border-b overflow-x-auto scrollbar-hide">
  {tabs.map(t => (
    <button
      key={t}
      onClick={() => setActive(t)}
      className={`px-6 py-3 text-sm font-medium relative hover:bg-accent/30 transition-colors ${
        active === t ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {t}
      {active === t && (
        <span className="absolute left-0 right-0 -bottom-px h-1 bg-primary rounded-full" />
      )}
    </button>
  ))}
</div>

			<div className="py-6 text-sm min-h-40">
				{active === 'Posts' && <Posts />}
				{active === 'About' && (isCompany ? <CompanyAbout /> : <About />)}
				{active === 'Jobs' && <Jobs />}
			</div>
		</div>
	)
}
