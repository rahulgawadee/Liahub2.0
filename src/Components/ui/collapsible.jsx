import React, { useState } from 'react'

export const Collapsible = ({ children, asChild=false, defaultOpen=false }) => {
  const [open, setOpen] = useState(defaultOpen)
  return <div data-state={open? 'open':'closed'}>{
    React.Children.map(children, child => React.isValidElement(child)? React.cloneElement(child, { __open:open, __setOpen:setOpen }): child)
  }</div>
}
export const CollapsibleTrigger = ({ children, __setOpen }) => React.cloneElement(children, { onClick: (e)=>{ children.props.onClick?.(e); __setOpen(o=>!o) } })
export const CollapsibleContent = ({ children, __open }) => __open? <div className="mt-1">{children}</div>: null
