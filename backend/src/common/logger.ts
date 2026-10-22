export interface Logger {
  info(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
  debug(message: string, ...meta: unknown[]): void;
}

export const logger: Logger = {
  info: (msg, ...meta) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, ...meta),
  warn: (msg, ...meta) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, ...meta),
  error: (msg, ...meta) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, ...meta),
  debug: (msg, ...meta) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, ...meta);
    }
  },
};
