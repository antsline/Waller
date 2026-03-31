import React from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { useTranslation } from 'react-i18next'
import type { MyPageScreenProps } from '@/types/navigation'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { colors } from '@/constants/colors'

const ALLOWED_HOSTS = ['waller.app'] as const

function isAllowedUri(uri: string): boolean {
  try {
    const { hostname } = new URL(uri)
    return ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`),
    )
  } catch {
    return false
  }
}

export function WebViewScreen({ route }: MyPageScreenProps<'WebView'>) {
  const { uri } = route.params
  const { t } = useTranslation()

  if (!isAllowedUri(uri)) {
    return <EmptyState title={t('error.generic')} />
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => <Spinner />}
        onShouldStartLoadWithRequest={(request) => isAllowedUri(request.url)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
  },
})
