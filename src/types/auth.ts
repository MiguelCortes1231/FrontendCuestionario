// 👤 Representa al usuario autenticado que la app necesita para UI y sesión.
export interface AuthUser {
  id: number;
  username: string;
  nombre: string;
}

// 🔐 Respuesta esperada del endpoint de login.
export interface LoginResponse {
  token: string;
  type: string;
  expires_in: number;
  user: AuthUser;
}
