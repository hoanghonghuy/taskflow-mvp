import React from 'react'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface HighlightTextProps {
  text: string
  term?: string
  className?: string
}

export const HighlightText: React.FC<HighlightTextProps> = ({ text, term, className }) => {
  const query = term?.trim()
  if (!query) {
    return <span className={className}>{text}</span>
  }

  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-primary/20 text-foreground rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </span>
  )
}
