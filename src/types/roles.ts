export enum UserRoleEnum {
    ADMIN = 'admin',
    USER = 'user',
    MANAGER = 'manager'
}

export type UserRole = keyof typeof UserRoleEnum;