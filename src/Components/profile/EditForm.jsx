import React from 'react'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'

export default function EditForm({ form, onChange, onCancel, onSubmit, isSubmitting = false, isCompany = false }){
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs mb-1">{isCompany ? 'Company Name' : 'School Name'}</label>
        <Input name="name" value={form.name} onChange={onChange} disabled={isSubmitting} />
      </div>
      <div>
        <label className="block text-xs mb-1">Handle</label>
        <Input name="handle" value={form.handle} onChange={onChange} disabled={isSubmitting} />
      </div>
      <div>
        <label className="block text-xs mb-1">Bio</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={onChange}
          disabled={isSubmitting}
          className="w-full rounded-md border border-input bg-background p-2 text-sm h-24 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs mb-1">Location</label>
          <Input name="location" value={form.location} onChange={onChange} disabled={isSubmitting} />
        </div>
        <div>
          <label className="block text-xs mb-1">Website</label>
          <Input name="website" value={form.website} onChange={onChange} disabled={isSubmitting} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
