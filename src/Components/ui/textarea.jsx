import * as React from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/useTheme"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  const { isDark } = useTheme()
  return (
    <textarea
      className={cn(
        `flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300
        ${isDark 
          ? 'border-gray-600 bg-black text-white placeholder:text-gray-500 focus-visible:ring-gray-700' 
          : 'border-gray-300 bg-white text-black placeholder:text-gray-500 focus-visible:ring-gray-200'
        }`,
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
