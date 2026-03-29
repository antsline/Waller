import React, { Component, type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { spacing } from '@/constants/spacing'
import { Button } from './Button'
import i18n from '@/i18n'

interface Props {
  readonly children: ReactNode
  readonly fallbackMessage?: string
}

interface State {
  readonly hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
    // TODO: Send to error reporting service (e.g., Sentry) in production
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>
            {this.props.fallbackMessage ?? i18n.t('error.generic')}
          </Text>
          <Button
            title={i18n.t('common.retry')}
            onPress={this.handleRetry}
            variant="secondary"
            style={styles.button}
          />
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    backgroundColor: colors.background,
  },
  title: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    minWidth: 120,
  },
})
