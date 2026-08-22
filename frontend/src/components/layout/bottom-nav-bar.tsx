'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from '@/components/providers/settings-provider'
import { useI18n } from '@/lib/i18n/hooks'
import { MenuIcon } from '@/lib/icons'
import type { View } from '@/types'
import { APP_FEATURES, getPathForView, getViewFromPathname } from '@/lib/navigation/features'
import { usePathname, useRouter } from 'next/navigation'

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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    firstItemRef.current?.focus()
  }, [])

  const handleSelect = (view: View) => {
    onClose()
    router.push(getPathForView(view))
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      className="absolute bottom-full right-2 mb-2 w-52 overflow-hidden rounded-xl border border-border/80 bg-card p-2 shadow-xl animate-in fade-in-0 slide-in-from-bottom-2 duration-150 motion-reduce:animate-none"
    >
      {hiddenViews.map((view, index) => {
        const feature = APP_FEATURES.find((item) => item.view === view)
        if (!feature) return null
        const Icon = feature.icon
        const isActive = currentView === view

        return (
          <button
            key={view}
            ref={index === 0 ? firstItemRef : undefined}
            type="button"
            role="menuitem"
            onClick={() => handleSelect(view)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none ${
              isActive
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-foreground hover:bg-muted/60'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{t(feature.label)}</span>
          </button>
        )
      })}
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
      className={`bottom-nav-button relative mx-0.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none ${
        isActive ? 'font-semibold text-primary' : 'text-muted-foreground'
      }`}
      data-active={isActive ? 'true' : undefined}
    >
      <Icon className="relative h-5 w-5" />
      <span className="relative w-full truncate px-1 font-medium">{label}</span>
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

  const bottomNavActions = useMemo(
    () => settings.bottomNavActions ?? ['dashboard', 'list', 'board', 'calendar'],
    [settings.bottomNavActions],
  )

  const { visibleFeatures, hiddenFeatures } = useMemo(() => {
    const visible = APP_FEATURES.filter((feature) => bottomNavActions.includes(feature.view))
    const hidden = APP_FEATURES.filter((feature) => !bottomNavActions.includes(feature.view)).map(
      (feature) => feature.view,
    )
    return { visibleFeatures: visible, hiddenFeatures: hidden }
  }, [bottomNavActions])

  const currentView = getViewFromPathname(pathname)
  const hasHiddenActive = hiddenFeatures.includes(currentView)

  const handleFeatureSelect = useCallback(
    (view: View) => {
      setIsMoreMenuOpen(false)
      router.push(getPathForView(view))
    },
    [router],
  )

  return (
    <nav
      aria-label={t('feature.more')}
      className="fixed bottom-0 left-0 right-0 z-30 flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] items-stretch justify-around border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom,0px)] shadow-lg backdrop-blur-md md:hidden"
    >
      {visibleFeatures.map((feature) => (
        <BottomNavButton
          key={feature.view}
          feature={feature}
          isActive={currentView === feature.view}
          onSelect={handleFeatureSelect}
          label={t(feature.label)}
        />
      ))}

      {hiddenFeatures.length > 0 && (
        <div className="relative flex min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={isMoreMenuOpen}
            className={`bottom-nav-button relative mx-0.5 flex w-full flex-col items-center justify-center gap-1 rounded-lg text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none ${
              isMoreMenuOpen || hasHiddenActive
                ? 'font-semibold text-primary'
                : 'text-muted-foreground'
            }`}
            data-active={isMoreMenuOpen || hasHiddenActive ? 'true' : undefined}
          >
            <MenuIcon className="h-5 w-5" />
            <span className="w-full truncate px-1 font-medium">{t('feature.more')}</span>
            <span className="bottom-nav-indicator" aria-hidden="true" />
          </button>

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