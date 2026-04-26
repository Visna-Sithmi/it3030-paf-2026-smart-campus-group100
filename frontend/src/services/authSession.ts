const AUTH_KEYS = [
  "user",
  "role",
  "studentId",
  "studentName",
  "name",
  "email",
  "id",
  "profileImageUrl",
  "managerType",
  "isAdminLoggedIn",
  "adminName",
  "adminEmail",
  "adminRole",
];

export const getAuthItem = (key: string): string | null => {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
};

export const setAuthItem = (key: string, value: string): void => {
  sessionStorage.setItem(key, value);
  localStorage.setItem(key, value);
};

export const removeAuthItem = (key: string): void => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

export const clearAuthSession = (): void => {
  AUTH_KEYS.forEach(removeAuthItem);
};
