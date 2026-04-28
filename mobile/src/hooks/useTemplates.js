import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../api/templates'

export default function useTemplates() {
  const queryClient = useQueryClient()

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => getTemplates().then((res) => res.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['templates'] })

  const create = async (data) => { await createTemplate(data); invalidate() }
  const update = async (id, data) => { await updateTemplate(id, data); invalidate() }
  const remove = async (id) => { await deleteTemplate(id); invalidate() }

  return { templates, create, update, remove }
}
