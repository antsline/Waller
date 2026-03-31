import React from 'react'
import { renderHook, act } from '@testing-library/react-native'

const mockChangeLanguage = jest.fn().mockResolvedValue(undefined)
const mockFrom = jest.fn()

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      language: 'ja',
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}))

const mockUser = {
  id: 'user-1',
  username: 'test',
  display_name: 'Test',
  locale: 'ja',
}

const mockSetUser = jest.fn()

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({
      user: mockUser,
      setUser: mockSetUser,
    }),
  ),
}))

import { useLanguage } from '../useLanguage'

describe('useLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFrom.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })
  })

  it('returns current locale', () => {
    const { result } = renderHook(() => useLanguage())
    expect(result.current.locale).toBe('ja')
  })

  it('changes language and updates DB', async () => {
    const { result } = renderHook(() => useLanguage())

    await act(async () => {
      await result.current.changeLocale('en')
    })

    expect(mockChangeLanguage).toHaveBeenCalledWith('en')
    expect(mockSetUser).toHaveBeenCalledWith({
      ...mockUser,
      locale: 'en',
    })
    expect(mockFrom).toHaveBeenCalledWith('users')
  })
})
