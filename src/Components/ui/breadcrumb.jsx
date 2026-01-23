import React from 'react'
export const Breadcrumb = ({ children, className='' }) => <nav className={className}>{children}</nav>
export const BreadcrumbList = ({ children }) => <ol className="flex items-center gap-2 text-xs text-muted-foreground">{children}</ol>
export const BreadcrumbItem = ({ children }) => <li className="flex items-center gap-2">{children}</li>
export const BreadcrumbLink = ({ href='#', children }) => <a href={href} className="hover:text-foreground underline-offset-4 hover:underline">{children}</a>
export const BreadcrumbPage = ({ children }) => <span className="text-foreground font-medium">{children}</span>
export const BreadcrumbSeparator = () => <span className="opacity-40">/</span>
