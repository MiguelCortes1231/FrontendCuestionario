// 👤 Representa al usuario autenticado que la app necesita para UI y sesión.
export interface AuthUser {
  id: number;
  username: string;
  nombre: string;
}

// 🔐 Claims básicos del JWT necesarios para validar la sesión en frontend.
export interface JwtPayload {
  iss?: string;
  iat?: number;
  exp?: number;
  nbf?: number;
  jti?: string;
  sub?: string;
  prv?: string;
}

// 🔐 Respuesta esperada del endpoint de login.
export interface LoginResponse {
  token: string;
  type: string;
  expires_in: number;
  user: AuthUser;
}
