import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { I18nProvider } from '@/components/providers/i18n-provider'
import { useI18n } from '@/lib/i18n/hooks'

function TranslationProbe() {
  const { t } = useI18n()
  return <span>{t('nav.dashboard')}</span>
}

describe('I18nProvider', () => {
  it('renders children with working translations', () => {
    render(
      <I18nProvider>
        <TranslationProbe />
      </I18nProvider>
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
