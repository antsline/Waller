import { create } from 'zustand'

type UploadStep = 'idle' | 'video' | 'thumbnail' | 'saving' | 'done' | 'error'

interface ClipUploadState {
  readonly step: UploadStep
  readonly error: string | null
}

interface ClipUploadActions {
  readonly setStep: (step: UploadStep) => void
  readonly setError: (error: string) => void
  readonly reset: () => void
}

const initialState: ClipUploadState = {
  step: 'idle',
  error: null,
}

export const useClipUploadStore = create<ClipUploadState & ClipUploadActions>(
  (set) => ({
    ...initialState,

    setStep: (step) => set({ step, error: null }),

    setError: (error) => set({ step: 'error', error }),

    reset: () => set(initialState),
  }),
)
