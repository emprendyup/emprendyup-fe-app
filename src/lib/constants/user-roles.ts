export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  ENTREPRENEUR: 'ENTREPRENEUR',
  MANAGER: 'MANAGER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: 'Admin' },
  { value: USER_ROLES.USER, label: 'Usuario' },
  { value: USER_ROLES.ENTREPRENEUR, label: 'Emprendedor' },
  { value: USER_ROLES.MANAGER, label: 'Manager' },
];
