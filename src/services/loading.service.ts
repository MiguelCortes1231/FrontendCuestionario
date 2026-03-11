/**
 * ⏳ Servicio global de carga
 *
 * Maneja un contador interno para soportar múltiples operaciones concurrentes.
 * Si varias llamadas HTTP arrancan al mismo tiempo, el loader no desaparece
 * hasta que todas terminan ✅
 */
type Listener = (visible: boolean) => void;

class LoadingService {
  private listeners = new Set<Listener>();
  private counter = 0;

  // ➕ Incrementa operaciones activas y notifica visibilidad.
  show() {
    this.counter += 1;
    this.emit(true);
  }

  // ➖ Reduce operaciones activas sin permitir valores negativos.
  hide() {
    this.counter = Math.max(0, this.counter - 1);
    this.emit(this.counter > 0);
  }

  // 📡 Permite que componentes reaccionen al estado del loader.
  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 📣 Emite el estado actual a todos los suscriptores.
  private emit(value: boolean) {
    this.listeners.forEach((listener) => listener(value));
  }
}

export const loadingService = new LoadingService();
