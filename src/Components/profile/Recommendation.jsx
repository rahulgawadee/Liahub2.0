import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'

const suggestions = [
  { name: 'Greenwood High', location: 'Bangalore, India' },
  { name: 'Delhi Public School', location: 'Delhi, India' },
  { name: 'The Doon School', location: 'Dehradun, India' },
]

export default function Recommendation(){
  return (
    <div className="space-y-4 pt-2">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input 
          placeholder="Search" 
          className="pl-10 rounded-full bg-accent/30 border-0 focus-visible:ring-1"
        />
      </div>

      {/* You might like section */}
      <div className="rounded-2xl bg-accent/20 overflow-hidden">
        <div className="p-4">
          <h3 className="text-xl font-bold">Schools you might like</h3>
        </div>
        <div className="space-y-1">
          {suggestions.map((item, i) => (
            <div key={i} className="px-4 py-3 hover:bg-accent/30 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-10 w-10 rounded-full">
                  <AvatarFallback />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate">{item.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{item.location}</div>
                </div>
              </div>
              <Button size="sm" className="rounded-full px-4 py-1 h-8 bg-white text-black hover:bg-gray-200 font-semibold">
                Follow
              </Button>
            </div>
          ))}
        </div>
        <button className="w-full px-4 py-3 text-left text-sm text-blue-500 hover:bg-accent/30 transition-colors">
          Show more
        </button>
      </div>
    </div>
  )
}
      
