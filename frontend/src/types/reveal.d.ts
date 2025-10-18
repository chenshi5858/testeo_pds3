declare module 'reveal.js' {
  const Reveal: any;
  namespace Reveal {
    export interface Api {
      initialize(options?: any): void;
      slide(index: number, dest?: number, instant?: boolean): void;
      sync(): void;
      configure?(options: any): void;
    }
  }
  export default Reveal;
}
