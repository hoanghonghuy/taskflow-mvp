'use client'

import { useCallback } from 'react'
import { AI_FEATURES_ENABLED } from '@/lib/feature-flags'
import { useI18n } from '@/lib/i18n/hooks'
import { useToast } from '@/lib/hooks/use-toast'

export function useAiFeature() {
  const { t } = useI18n()
  const { info } = useToast()

  const notifyComingSoon = useCallback(() => {
    info(t('ai.comingSoon.title'), t('ai.comingSoon.message'))
  }, [info, t])

  const runIfEnabled = useCallback(
    (action: () => void) => {
      if (!AI_FEATURES_ENABLED) {
        notifyComingSoon()
        return
      }
      action()
    },
    [notifyComingSoon],
  )

  return {
    isEnabled: AI_FEATURES_ENABLED,
    notifyComingSoon,
    runIfEnabled,
  }
}
