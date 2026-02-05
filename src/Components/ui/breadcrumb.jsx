import React from 'react'
import { useTheme } from '@/hooks/useTheme'

export const Breadcrumb = ({ children, className='' }) => <nav className={className}>{children}</nav>

export const BreadcrumbList = ({ children }) => {
  const { isDark } = useTheme()
  return <ol className={`flex items-center gap-2 text-xs transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{children}</ol>
}

export const BreadcrumbItem = ({ children }) => <li className="flex items-center gap-2">{children}</li>

export const BreadcrumbLink = ({ href='#', children }) => {
  const { isDark } = useTheme()
  return <a href={href} className={`underline-offset-4 hover:underline transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>{children}</a>
}

export const BreadcrumbPage = ({ children }) => {
  const { isDark } = useTheme()
  return <span className={`font-medium transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{children}</span>
}

export const BreadcrumbSeparator = () => {
  const { isDark } = useTheme()
  return <span className={`transition-colors duration-300 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>/</span>
}
