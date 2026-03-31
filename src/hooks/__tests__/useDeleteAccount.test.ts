const mockRpc = jest.fn()
const mockSignOut = jest.fn().mockResolvedValue({ error: null })
const mockClearSession = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      signOut: () => mockSignOut(),
    },
  },
}))

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn((selector) =>
    selector({
      session: { user: { id: 'user-1' } },
      clearSession: mockClearSession,
    }),
  ),
}))

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn((opts) => ({
    mutateAsync: () => opts.mutationFn(),
    isPending: false,
  })),
}))

import { useDeleteAccount } from '../useDeleteAccount'

describe('useDeleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls delete_account RPC and signs out', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'deleted' },
      error: null,
    })

    const hook = useDeleteAccount()
    await hook.mutateAsync()

    expect(mockRpc).toHaveBeenCalledWith('delete_account')
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('throws when RPC returns error status', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'error', code: 'account_not_found' },
      error: null,
    })

    const hook = useDeleteAccount()
    await expect(hook.mutateAsync()).rejects.toThrow('account_not_found')
  })

  it('throws when RPC call itself fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'server error' },
    })

    const hook = useDeleteAccount()
    await expect(hook.mutateAsync()).rejects.toThrow('Failed to delete account')
  })

  it('throws when sign out fails', async () => {
    mockRpc.mockResolvedValue({
      data: { status: 'deleted' },
      error: null,
    })
    mockSignOut.mockResolvedValueOnce({ error: { message: 'sign out failed' } })

    const hook = useDeleteAccount()
    await expect(hook.mutateAsync()).rejects.toThrow('Failed to sign out')
  })
})
