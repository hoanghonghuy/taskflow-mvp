'use client'

import React from 'react'
import Image from 'next/image'
import type { User } from '@/types'

interface AvatarProps {
  user: User | null
  className?: string
}

const getInitials = (name: string): string => {
  const names = name.split(' ')
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function Avatar({ user, className }: AvatarProps) {
  const baseClasses = className ? `${className}` : 'w-10 h-10'
  const textClasses = `${baseClasses} flex items-center justify-center rounded-full`

  if (!user) {
    return (
      <div className={`${textClasses} bg-secondary text-muted-foreground`}>
        ?
      </div>
    )
  }

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={40}
        height={40}
        className={`rounded-full object-cover ${className || 'w-10 h-10'}`}
        unoptimized
      />
    )
  }

  return (
    <div className={`${textClasses} bg-primary/20 text-primary font-bold`}>
      {getInitials(user.name)}
    </div>
  )
}

// Export both default and named for flexibility
export default Avatar
export { Avatar }
