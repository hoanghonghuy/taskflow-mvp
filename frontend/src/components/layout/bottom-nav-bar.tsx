'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { MenuIcon } from '@/lib/icons'
import type { View } from '@/types'
import { APP_FEATURES, getPathForView, getViewFromPathname } from '@/lib/navigation/features'
import { useRouter, usePathname } from 'next/navigation'

interface MoreMenuProps {
  hiddenViews: View[]
  currentView: View
  onClose: () => void
}

const MoreMenu: React.FC<MoreMenuProps> = ({ hiddenViews, currentView, onClose }) => {
  const router = useRouter()
  const { t } = useI18n()
  const menuRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    if (firstItemRef.current) {
      firstItemRef.current.focus()
    }
  }, [])

  const handleSelect = (view: View) => {
    router.push(getPathForView(view))
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-border/80 bg-card shadow-xl backdrop-blur-xl animate-fade-in"
    >
      <div className="p-2 space-y-1">
        {hiddenViews.map((view, index) => {
          const feature = APP_FEATURES.find(f => f.view === view)
          if (!feature) return null
          const Icon = feature.icon
          const isActive = currentView === view
          return (
            <button
              key={view}
              ref={index === 0 ? firstItemRef : undefined}
              onClick={() => handleSelect(view)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg border transition-colors ${
                isActive
                  ? 'border-border bg-muted text-foreground'
                  : 'border-transparent text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span>{t(feature.label)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface BottomNavButtonProps {
  feature: (typeof APP_FEATURES)[number]
  isActive: boolean
  onSelect: (view: View) => void
  label: string
}

function BottomNavButton({ feature, isActive, onSelect, label }: BottomNavButtonProps) {
  const Icon = feature.icon
  return (
    <button
      type="button"
      onClick={() => onSelect(feature.view)}
      aria-current={isActive ? 'page' : undefined}
      className={`bottom-nav-button relative flex flex-col items-center justify-center gap-1 flex-1 mx-1 text-[10px] ${
        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
      }`}
      data-active={isActive ? 'true' : undefined}
    >
      <Icon className="h-6 w-6 relative" />
      <span className="font-medium relative whitespace-nowrap">{label}</span>
      <span className="bottom-nav-indicator" aria-hidden="true" />
    </button>
  )
}

export default function BottomNavBar() {
  const { settings } = useSettings()
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const bottomNavActions = useMemo(() => {
    return settings.bottomNavActions ?? ['dashboard', 'list', 'board', 'calendar']
  }, [settings.bottomNavActions])

  const { visibleFeatures, hiddenFeatures } = useMemo(() => {
    const visible = APP_FEATURES.filter(f => bottomNavActions.includes(f.view))
    const hidden = APP_FEATURES.filter(f => !bottomNavActions.includes(f.view)).map(f => f.view)
    return { visibleFeatures: visible, hiddenFeatures: hidden }
  }, [bottomNavActions])

  const currentView = getViewFromPathname(pathname)

  const handleFeatureSelect = useCallback((view: View) => {
    router.push(getPathForView(view))
  }, [router])

  const hasHiddenActive = hiddenFeatures.includes(currentView)

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-card border-t border-border flex items-stretch justify-around z-30 shadow-lg">
      {visibleFeatures.map(feature => (
        <BottomNavButton
          key={feature.view}
          feature={feature}
          isActive={currentView === feature.view}
          onSelect={handleFeatureSelect}
          label={t(feature.label)}
        />
      ))}
      {hiddenFeatures.length > 0 && (
        <div className="relative flex-1 flex">
          {(() => {
            const isMoreActive = isMoreMenuOpen || hasHiddenActive
            return (
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(p => !p)}
            aria-haspopup="menu"
            aria-expanded={isMoreActive}
            className={`bottom-nav-button relative flex flex-col items-center justify-center gap-1 w-full mx-1 text-[10px] ${
              isMoreActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
            }`}
            data-active={isMoreActive ? 'true' : undefined}
          >
            <MenuIcon className="h-6 w-6" />
            <span className="font-medium relative text-[10px] whitespace-nowrap">{t('feature.more')}</span>
            <span className="bottom-nav-indicator" aria-hidden="true" />
          </button>
            )
          })()}
          {isMoreMenuOpen && (
            <MoreMenu
              hiddenViews={hiddenFeatures}
              currentView={currentView}
              onClose={() => setIsMoreMenuOpen(false)}
            />
          )}
        </div>
      )}
    </nav>
  )
}
