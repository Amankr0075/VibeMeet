import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = (window as any).Buffer || Buffer;
  (window as any).process = (window as any).process || { env: {} };
}
