export interface AuthUser {
  id: number;
  username: string;
  nombre: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  expires_in: number;
  user: AuthUser;
}
