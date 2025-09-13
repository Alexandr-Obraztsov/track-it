import { DataSource, Repository } from 'typeorm'
import { RoleEntity } from '../entities/Role'

// Сервис для управления ролями
export class RoleService {
    private roleRepository: Repository<RoleEntity>

    constructor(dataSource: DataSource) {
        this.roleRepository = dataSource.getRepository(RoleEntity)
    }

    // Создание новой роли
    async createRole(roleData: {
        name: string
        chatId: string
    }): Promise<RoleEntity> {
        // Проверяем, не существует ли роль с таким именем в этом чате
        const existingRole = await this.roleRepository.findOne({
            where: { name: roleData.name, chatId: roleData.chatId }
        })

        if (existingRole) {
            return existingRole
        }

        const role = this.roleRepository.create({
            name: roleData.name,
            chatId: roleData.chatId
        })
        
        return await this.roleRepository.save(role)
    }

    // Получение всех ролей в чате
    async getChatRoles(chatId: string): Promise<RoleEntity[]> {
        return await this.roleRepository.find({
            where: { chatId },
            order: { createdAt: 'ASC' }
        })
    }

    // Получение роли по имени и чату
    async getRoleByName(chatId: string, roleName: string): Promise<RoleEntity | null> {
        return await this.roleRepository.findOne({
            where: { name: roleName, chatId }
        })
    }

    // Получение роли по ID
    async getRoleById(roleId: number): Promise<RoleEntity | null> {
        return await this.roleRepository.findOne({
            where: { id: roleId }
        })
    }

    // Удаление роли
    async deleteRole(roleId: number): Promise<boolean> {
        const result = await this.roleRepository.delete({ id: roleId })
        return (result.affected ?? 0) > 0
    }

    // Обновление роли
    async updateRole(roleId: number, updateData: Partial<{
        name: string
    }>): Promise<RoleEntity | null> {
        const role = await this.getRoleById(roleId)
        if (!role) return null

        Object.assign(role, updateData)
        return await this.roleRepository.save(role)
    }

    // Создание ролей по умолчанию для нового чата
    async createDefaultRoles(chatId: string): Promise<RoleEntity[]> {
        const defaultRoles = [
            { name: 'member', chatId },
            { name: 'moderator', chatId },
            { name: 'admin', chatId }
        ]

        const createdRoles: RoleEntity[] = []

        for (const roleData of defaultRoles) {
            const role = await this.createRole(roleData)
            createdRoles.push(role)
        }

        return createdRoles
    }

    // Назначение роли пользователю
    async assignRoleToUser(chatId: string, userId: string, roleName: string): Promise<boolean> {
        try {
            // Используем ChatService для получения участника и обновления его роли
            // Этот метод будет вызывать ChatService через контроллер
            return true
        } catch (error) {
            console.error('Ошибка при назначении роли:', error)
            return false
        }
    }

    // Удаление роли у пользователя
    async removeRoleFromUser(chatId: string, userId: string): Promise<boolean> {
        try {
            // Этот метод будет вызывать ChatService через контроллер
            return true
        } catch (error) {
            console.error('Ошибка при удалении роли:', error)
            return false
        }
    }
}