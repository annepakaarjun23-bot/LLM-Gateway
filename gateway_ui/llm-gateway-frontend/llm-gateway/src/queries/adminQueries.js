import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

// ─── API Keys ────────────────────────────────────────────────────────────────

export function useApiKeys() {
  return useQuery({
    queryKey: ['admin', 'keys'],
    queryFn: async () => {
      const { data } = await api.get('/admin/keys')
      return data
    },
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name) => {
      const { data } = await api.post('/admin/keys', { name: name || undefined })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'keys'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'quota'] })
    },
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/keys/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'keys'] })
    },
  })
}

// ─── Quota ───────────────────────────────────────────────────────────────────

export function useQuota() {
  return useQuery({
    queryKey: ['admin', 'quota'],
    queryFn: async () => {
      const { data } = await api.get('/admin/quota')
      return data
    },
    refetchInterval: 60_000, // refresh every minute
  })
}

// ─── Usage / Analytics ───────────────────────────────────────────────────────

export function useUsage({ from, to, model, page = 1, perPage = 20 } = {}) {
  return useQuery({
    queryKey: ['admin', 'usage', { from, to, model, page, perPage }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (model) params.set('model', model)
      params.set('page', String(page))
      params.set('per_page', String(perPage))
      const { data } = await api.get(`/admin/usage?${params.toString()}`)
      return data
    },
  })
}

// ─── Models / Routing ────────────────────────────────────────────────────────

export function useModels() {
  return useQuery({
    queryKey: ['admin', 'models'],
    queryFn: async () => {
      const { data } = await api.get('/admin/models')
      return data
    },
  })
}
