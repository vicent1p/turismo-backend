import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { existsSync, mkdirSync, appendFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export interface LogErrorDetails {
  method: string;
  url: string;
  statusCode: number;
  exceptionType: string;
  message: string;
  stack?: string;
  timestamp?: string;
}

@Injectable()
export class LogWriterService {
  private readonly logger = new Logger(LogWriterService.name);
  private baseLogsDir = join(process.cwd(), 'logs');

  /** Permite sobreescribir el directorio base (útil para pruebas unitarias) */
  setBaseLogsDir(dir: string): void {
    this.baseLogsDir = dir;
  }

  getBaseLogsDir(): string {
    return this.baseLogsDir;
  }

  /**
   * Escribe los detalles de una excepción en logs/YYYY-MM-DD/errors.txt
   * Crea la carpeta del día automáticamente y acumula las entradas con append.
   */
  writeErrorLog(details: LogErrorDetails): void {
    try {
      const now = new Date();
      const dateFolder = now.toISOString().slice(0, 10); // Formato YYYY-MM-DD
      const folderPath = join(this.baseLogsDir, dateFolder);

      if (!existsSync(folderPath)) {
        mkdirSync(folderPath, { recursive: true });
      }

      const filePath = join(folderPath, 'errors.txt');
      const timestamp = details.timestamp ?? now.toISOString();

      const logEntry = [
        '--------------------------------------------------------------------------------',
        `Timestamp:      ${timestamp}`,
        `HTTP Method:    ${details.method}`,
        `URL:            ${details.url}`,
        `Status Code:    ${details.statusCode}`,
        `Exception Type: ${details.exceptionType}`,
        `Message:        ${details.message}`,
        `Stack Trace:`,
        details.stack ?? 'No stack trace available',
        '--------------------------------------------------------------------------------\n',
      ].join('\n');

      appendFileSync(filePath, logEntry, 'utf8');
    } catch (err) {
      this.logger.error(`Error persistiendo log de excepción en disco: ${(err as Error).message}`);
    }
  }

  /**
   * Cron job que se ejecuta cada medianoche (00:00) para eliminar automáticamente
   * carpetas de logs que tengan más de 10 días de antigüedad junto con su contenido.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleMidnightLogCleanup(): void {
    this.cleanupOldLogs(10);
  }

  /**
   * Elimina carpetas de logs con más de `daysToKeep` días de antigüedad.
   */
  cleanupOldLogs(daysToKeep = 10): number {
    if (!existsSync(this.baseLogsDir)) return 0;

    let removedCount = 0;
    const now = Date.now();
    const thresholdMs = daysToKeep * 24 * 60 * 60 * 1000;

    try {
      const entries = readdirSync(this.baseLogsDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderPath = join(this.baseLogsDir, entry.name);
          let shouldDelete = false;

          // Si el nombre tiene formato YYYY-MM-DD, comparar por fecha ISO
          const matchDate = /^\d{4}-\d{2}-\d{2}$/.test(entry.name);
          if (matchDate) {
            const folderDate = new Date(`${entry.name}T00:00:00Z`).getTime();
            if (!isNaN(folderDate) && now - folderDate > thresholdMs) {
              shouldDelete = true;
            }
          } else {
            // Comparación de respaldo por fecha de modificación
            const stats = statSync(folderPath);
            if (now - stats.mtimeMs > thresholdMs) {
              shouldDelete = true;
            }
          }

          if (shouldDelete) {
            rmSync(folderPath, { recursive: true, force: true });
            removedCount++;
            this.logger.log(`Carpeta de logs antigua eliminada: ${entry.name}`);
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error durante la limpieza de logs antiguos: ${(err as Error).message}`);
    }

    return removedCount;
  }
}
