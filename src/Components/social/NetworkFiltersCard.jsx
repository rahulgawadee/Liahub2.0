import React from 'react'

export default function NetworkFiltersCard({ options = [], selected = [], onToggle, onClear }) {
  return (
    <div className="rounded-xl bg-[#121212] p-4 text-white">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Filters</h3>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-white/70 hover:text-white transition"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-white/70 mb-3">Show results for</p>
      <div className="space-y-2">
        {options.length ? (
          options.map((option) => {
            const isActive = selected.includes(option.key)
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onToggle(option.key)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'bg-[#1c1c1c] text-white hover:bg-[#252525]'
                }`}
              >
                <span className="truncate">{option.label}</span>
              </button>
            )
          })
        ) : (
          <div className="text-xs text-white/70">No filters available</div>
        )}
      </div>
    </div>
  )
}
