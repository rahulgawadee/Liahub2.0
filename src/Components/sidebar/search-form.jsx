import React from 'react'
import { Input } from '../ui/input'

export function SearchForm({ className='' }){
  return <form className={className} onSubmit={e=>e.preventDefault()}>
    <Input placeholder="Search..." />
  </form>
}
