/**
 * 🔐 Tipos del dominio de autenticación
 * ---------------------------------------------------
 * Este archivo describe las formas mínimas de datos que el frontend
 * necesita para trabajar con login, sesión y JWT.
 *
 * 🎯 La idea es que las pantallas y servicios compartan un mismo contrato
 * y no anden usando objetos "sueltos" o ambiguos.
 */
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
