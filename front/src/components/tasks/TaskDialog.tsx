import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import type { CreateTaskDto, Task, UpdateTaskDto } from '@/types'
import { useCreateTaskMutation, useUpdateTaskMutation } from '@/store/api/tasksApi'
import { useGetUsersQuery } from '@/store/api/usersApi'
import { useGetChatsQuery } from '@/store/api/chatsApi'
import { useGetRolesQuery } from '@/store/api/rolesApi'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  isPersonal?: boolean // Флаг для личных задач (упрощённая форма)
}

export function TaskDialog({ open, onOpenChange, task, isPersonal = false }: TaskDialogProps) {
  const [formData, setFormData] = useState<Partial<CreateTaskDto>>({
    title: '',
    description: '',
    type: 'personal',
    deadline: '',
    chatId: '',
    assignedUserId: '',
    assignedRoleId: undefined,
  })

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation()
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation()
  const { data: users = [] } = useGetUsersQuery()
  const { data: chats = [] } = useGetChatsQuery()
  const { data: roles = [] } = useGetRolesQuery({ chatId: formData.chatId })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        type: task.type,
        deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
        chatId: task.chatId || '',
        assignedUserId: task.assignedUserId || '',
        assignedRoleId: task.assignedRoleId,
      })
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'personal',
        deadline: '',
        chatId: '',
        assignedUserId: '',
        assignedRoleId: undefined,
      })
    }
  }, [task, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (task) {
        const updateData: UpdateTaskDto = {
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline || undefined,
          assignedUserId: formData.assignedUserId || undefined,
          assignedRoleId: formData.assignedRoleId || undefined,
        }
        await updateTask({ id: task.id, data: updateData }).unwrap()
      } else {
        const createData: CreateTaskDto = {
          title: formData.title!,
          description: formData.description,
          type: formData.type!,
          deadline: formData.deadline || undefined,
          chatId: formData.type === 'group' ? formData.chatId : undefined,
          assignedUserId: formData.assignedUserId || undefined,
          assignedRoleId: formData.assignedRoleId || undefined,
        }
        await createTask(createData).unwrap()
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isPersonal ? "sm:max-w-[400px]" : "sm:max-w-[600px]"}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {task ? 'Редактировать задачу' : isPersonal ? 'Новая задача' : 'Создать новую задачу'}
            </DialogTitle>
            {!isPersonal && (
              <DialogDescription>
                {task ? 'Измените данные задачи' : 'Заполните информацию о новой задаче'}
              </DialogDescription>
            )}
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                {isPersonal ? 'Что нужно сделать?' : 'Название *'}
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={isPersonal ? "Например: Купить молоко" : "Введите название задачи"}
                required
                autoFocus
              />
            </div>
            
            {!isPersonal && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Описание
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Введите описание задачи"
                    rows={4}
                  />
                </div>
              </>
            )}
            
            {!task && !isPersonal && (
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Тип задачи *
                </label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'personal' | 'group' })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="personal">Личная</option>
                  <option value="group">Групповая</option>
                </select>
              </div>
            )}
            
            {formData.type === 'group' && (
              <div className="grid gap-2">
                <label htmlFor="chatId" className="text-sm font-medium">
                  Чат *
                </label>
                <select
                  id="chatId"
                  value={formData.chatId}
                  onChange={(e) => setFormData({ ...formData, chatId: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required={formData.type === 'group'}
                >
                  <option value="">Выберите чат</option>
                  {chats.map((chat) => (
                    <option key={chat.telegramId} value={chat.telegramId}>
                      {chat.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {!isPersonal && (
              <>
                <div className="grid gap-2">
                  <label htmlFor="deadline" className="text-sm font-medium">
                    Срок выполнения
                  </label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="assignedUserId" className="text-sm font-medium">
                    Назначить пользователю
                  </label>
                  <select
                    id="assignedUserId"
                    value={formData.assignedUserId}
                    onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Не назначено</option>
                    {users.map((user) => (
                      <option key={user.telegramId} value={user.telegramId}>
                        {user.firstName} {user.lastName} (@{user.username})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            {!isPersonal && formData.type === 'group' && formData.chatId && (
              <div className="grid gap-2">
                <label htmlFor="assignedRoleId" className="text-sm font-medium">
                  Назначить роли
                </label>
                <select
                  id="assignedRoleId"
                  value={formData.assignedRoleId || ''}
                  onChange={(e) => setFormData({ ...formData, assignedRoleId: e.target.value ? Number(e.target.value) : undefined })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Не назначено</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {task ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

