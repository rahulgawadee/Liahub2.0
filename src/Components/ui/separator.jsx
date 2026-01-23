import React from 'react'
export const Separator = ({ orientation='horizontal', className='' }) => <div className={(orientation==='vertical'? 'w-px h-full':'h-px w-full')+ ' bg-border '+className} />
