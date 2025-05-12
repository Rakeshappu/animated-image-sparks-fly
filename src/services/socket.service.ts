
import { io, Socket } from 'socket.io-client';

interface CustomNotificationOptions {
  body: string;
  icon?: string;
}

class SocketService {
  private socket: Socket | null = null;

  public connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(url);

      this.socket.on('connect', () => {
        console.log(`Connected to ${url}`);
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('Failed to connect:', err);
        reject(err);
      });
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      console.log('Disconnected');
    }
  }

  public emit(event: string, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  public showNotification(title: string, options: { body: string }): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: options.body,
        icon: '/logo.png'
      });
    }
  }
}

export default new SocketService();
