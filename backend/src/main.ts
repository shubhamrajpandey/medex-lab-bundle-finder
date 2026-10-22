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

    logger.info(
      `Catalog initialized with ${sanitized.selectableTests.length} selectable tests and ${sanitized.usablePackages.length} usable packages.`,
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
