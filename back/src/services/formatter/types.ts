import { UserEntity } from '../../entities/User'
import { RoleOperation } from '../../types'

export interface FormatRoleOperationParams extends RoleOperation {
	targetUser?: UserEntity
}