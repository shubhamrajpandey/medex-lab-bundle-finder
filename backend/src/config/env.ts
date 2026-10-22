import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface EnvConfig {
  port: number;
  nodeEnv: string;
  catalogPath: string;
}

export function loadEnv(): EnvConfig {
  const port = Number(process.env.PORT) || 3001;
  const nodeEnv = process.env.NODE_ENV || 'development';

  // Default resolves to backend/data/lab-catalog.json
  const defaultCatalogPath = path.resolve(__dirname, '../../data/lab-catalog.json');
  const catalogPath = process.env.CATALOG_PATH || defaultCatalogPath;

  return {
    port,
    nodeEnv,
    catalogPath,
  };
}
