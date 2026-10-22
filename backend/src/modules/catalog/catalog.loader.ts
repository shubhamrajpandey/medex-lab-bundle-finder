import fs from 'node:fs';
import type { RawCatalogData } from './catalog.types';

/**
 * Reads and parses the raw JSON catalog file from disk.
 * Keeps file I/O isolated so other layers remain pure.
 */
export function loadRawCatalogFile(filePath: string): RawCatalogData {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Catalog file not found at: ${filePath}`);
  }

  const rawContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(rawContent) as RawCatalogData;
}
