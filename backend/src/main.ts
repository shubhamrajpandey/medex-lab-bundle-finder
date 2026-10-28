import { createApp } from './app';
import { loadEnv } from './config/env';
import { logger } from './common/logger';
import { loadRawCatalogFile } from './modules/catalog/catalog.loader';
import { sanitizeCatalog } from './modules/catalog/catalog.sanitizer';
import { InMemoryCatalogRepository } from './modules/catalog/catalog.repository';

function bootstrap(): void {
  try {
    const env = loadEnv();

    logger.info(`Loading lab catalog from ${env.catalogPath}...`);
    const rawData = loadRawCatalogFile(env.catalogPath);
    const sanitized = sanitizeCatalog(rawData);
    const catalogRepo = new InMemoryCatalogRepository(sanitized);

    for (const warning of sanitized.warnings) {
      logger.warn(`[Catalog Warning] ${warning}`);
    }

    logger.info(
      `catalog loaded: ${sanitized.selectableTests.length} tests, ${sanitized.usablePackages.length} packages, ${sanitized.warnings.length} warnings`,
    );

    const app = createApp({ catalogRepo });

    app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode at http://localhost:${env.port}`);
    });
  } catch (error) {
    logger.error('Fatal startup error, shutting down process:', error);
    process.exit(1);
  }
}

bootstrap();
