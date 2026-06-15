import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api/templates'

export default function useTemplates() {
  const queryClient = useQueryClient()

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates().then((res) => res.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['templates'] })

  const create = async (data) => {
    const tempId = `temp-${Date.now()}`
    const prev = queryClient.getQueryData(['templates'])
    queryClient.setQueryData(['templates'], (old = []) => [...old, { id: tempId, ...data }])
    try {
      await createTemplate(data)
    } catch (e) {
      queryClient.setQueryData(['templates'], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  const update = async (id, data) => {
    const prev = queryClient.getQueryData(['templates'])
    queryClient.setQueryData(['templates'], (old = []) => old.map((t) => t.id === id ? { ...t, ...data } : t))
    try {
      await updateTemplate(id, data)
    } catch (e) {
      queryClient.setQueryData(['templates'], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  const remove = async (id) => {
    const prev = queryClient.getQueryData(['templates'])
    queryClient.setQueryData(['templates'], (old = []) => old.filter((t) => t.id !== id))
    try {
      await deleteTemplate(id)
    } catch (e) {
      queryClient.setQueryData(['templates'], prev)
      throw e
    } finally {
      invalidate()
    }
  }

  return { templates, create, update, remove }
}
