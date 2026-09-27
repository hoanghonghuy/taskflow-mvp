import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/components/providers/i18n-provider'
import { DateTimePicker } from '@/components/ui/date-time-picker'

describe('DateTimePicker', () => {
  it('uses the selected date local time in the time input', async () => {
    process.env.TZ = 'Asia/Ho_Chi_Minh'
    const value = new Date(2026, 6, 18, 15, 30)

    render(
      <I18nProvider initialLocale="en">
        <DateTimePicker value={value} onChange={() => undefined} />
      </I18nProvider>,
    )

    await userEvent.setup().click(screen.getByRole('button', { name: /Jul 18, 2026/i }))
    expect(screen.getByDisplayValue('15:30')).toBeInTheDocument()
  })
})
