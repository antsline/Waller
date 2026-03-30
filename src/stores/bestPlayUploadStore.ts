import { create } from 'zustand'

type UploadStep = 'idle' | 'video' | 'thumbnail' | 'saving' | 'done' | 'error'

interface BestPlayUploadState {
  readonly step: UploadStep
  readonly progress: number
  readonly error: string | null
}

interface BestPlayUploadActions {
  readonly setStep: (step: UploadStep) => void
  readonly setProgress: (progress: number) => void
  readonly setError: (error: string) => void
  readonly reset: () => void
}

const initialState: BestPlayUploadState = {
  step: 'idle',
  progress: 0,
  error: null,
}

export const useBestPlayUploadStore = create<BestPlayUploadState & BestPlayUploadActions>(
  (set) => ({
    ...initialState,

    setStep: (step) => set({ step, error: null }),

    setProgress: (progress) => set({ progress }),

    setError: (error) => set({ step: 'error', error }),

    reset: () => set(initialState),
  }),
)
