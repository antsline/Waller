import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

type Locale = 'ja' | 'en'

export function useLanguage() {
  const { i18n } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const locale = (i18n.language === 'ja' ? 'ja' : 'en') as Locale

  const changeLocale = useCallback(
    async (lang: Locale) => {
      const previousLocale = locale
      await i18n.changeLanguage(lang)

      if (user) {
        setUser({ ...user, locale: lang })

        const { error } = await supabase
          .from('users')
          .update({ locale: lang })
          .eq('id', user.id)

        if (error) {
          await i18n.changeLanguage(previousLocale)
          setUser({ ...user, locale: previousLocale })
          throw new Error('Failed to update language preference')
        }
      }
    },
    [i18n, user, setUser, locale],
  )

  return { locale, changeLocale } as const
}
