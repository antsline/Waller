import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { reportSchema } from '@/utils/validation'
import { useAuthStore } from '@/stores/authStore'
import type { ReportInput } from '@/utils/validation'

export function useReport() {
  const session = useAuthStore((s) => s.session)

  return useMutation({
    mutationFn: async (input: ReportInput) => {
      const userId = session?.user?.id
      if (!userId) {
        throw new Error('Not authenticated')
      }

      const validated = reportSchema.parse(input)

      const { error } = await supabase.from('reports').insert({
        reporter_user_id: userId,
        target_id: validated.target_id,
        target_type: validated.target_type,
        reason: validated.reason,
        reason_detail: validated.detail ?? null,
      })

      if (error) {
        if (error.code === '23505') {
          throw new Error('already_reported')
        }
        throw new Error('Failed to submit report')
      }
    },
  })
}
