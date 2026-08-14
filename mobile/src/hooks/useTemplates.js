import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api/templates'
import { queryKeys } from '../api/queryKeys'
import { optimisticListOptions } from './optimisticList'

export default function useTemplates() {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.templates

  const { data: templates = [] } = useQuery({
    queryKey,
    queryFn: () => getTemplates().then((res) => res.data),
  })

  const createMutation = useMutation(
    optimisticListOptions({
      queryClient,
      queryKey,
      mutationFn: (data) => createTemplate(data),
      apply: (list, data) => [...list, { id: `temp-${Date.now()}`, ...data }],
    })
  )

  const updateMutation = useMutation(
    optimisticListOptions({
      queryClient,
      queryKey,
      mutationFn: ({ id, data }) => updateTemplate(id, data),
      apply: (list, { id, data }) => list.map((tmpl) => (tmpl.id === id ? { ...tmpl, ...data } : tmpl)),
    })
  )

  const removeMutation = useMutation(
    optimisticListOptions({
      queryClient,
      queryKey,
      mutationFn: ({ id }) => deleteTemplate(id),
      apply: (list, { id }) => list.filter((tmpl) => tmpl.id !== id),
    })
  )

  return {
    templates,
    create: (data) => createMutation.mutateAsync(data),
    update: (id, data) => updateMutation.mutateAsync({ id, data }),
    remove: (id) => removeMutation.mutateAsync({ id }),
  }
}
