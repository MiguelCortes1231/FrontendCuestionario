type Listener = (visible: boolean) => void;

class LoadingService {
  private listeners = new Set<Listener>();
  private counter = 0;

  show() {
    this.counter += 1;
    this.emit(true);
  }

  hide() {
    this.counter = Math.max(0, this.counter - 1);
    this.emit(this.counter > 0);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(value: boolean) {
    this.listeners.forEach((listener) => listener(value));
  }
}

export const loadingService = new LoadingService();
