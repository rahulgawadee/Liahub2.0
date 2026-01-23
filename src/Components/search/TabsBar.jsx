import React from 'react'

const TABS = ['Jobs', 'Applied', 'Wishlist']

export default function TabsBar({ value = 'Jobs', onChange, counts = {} }) {
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange?.(tab)}
          className={
            'px-6 py-2.5 rounded-full border font-medium text-sm transition-all ' +
            (value === tab 
              ? 'bg-white text-black border-white' 
              : 'bg-transparent text-gray-300 border-gray-700 hover:bg-gray-800 hover:border-gray-600')
          }
        >
          {tab}
          {counts[tab] !== undefined && <span className="ml-2 text-xs opacity-70">({counts[tab]})</span>}
        </button>
      ))}
    </div>
  )
}
