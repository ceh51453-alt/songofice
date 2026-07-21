/**
 * Khai báo type tối thiểu cho ejs v6 (package không ship .d.ts).
 * Chỉ khai API app dùng: render (sync/async).
 */
declare module "ejs" {
  interface EjsOptions {
    async?: boolean;
    escape?: (v: unknown) => string;
    [key: string]: unknown;
  }
  interface Ejs {
    render(template: string, data: Record<string, unknown>, opts: EjsOptions & { async: true }): Promise<string>;
    render(template: string, data?: Record<string, unknown>, opts?: EjsOptions): string;
  }
  const ejs: Ejs;
  export default ejs;
}
