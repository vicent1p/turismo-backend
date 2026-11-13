import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LogWriterService } from './log-writer.service';

describe('LogWriterService', () => {
  let service: LogWriterService;
  const testLogsDir = join(__dirname, 'test-logs');

  beforeEach(() => {
    service = new LogWriterService();
    service.setBaseLogsDir(testLogsDir);

    if (existsSync(testLogsDir)) {
      rmSync(testLogsDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testLogsDir)) {
      rmSync(testLogsDir, { recursive: true, force: true });
    }
  });

  it('debe crear la carpeta del día y escribir el log en errors.txt', () => {
    const today = new Date().toISOString().slice(0, 10);
    service.writeErrorLog({
      method: 'GET',
      url: '/api/hoteles',
      statusCode: 500,
      exceptionType: 'InternalServerErrorException',
      message: 'Error de conexión simulado',
      stack: 'Error: Error de conexión\n    at mock.ts:10',
    });

    const expectedFile = join(testLogsDir, today, 'errors.txt');
    expect(existsSync(expectedFile)).toBe(true);

    const content = readFileSync(expectedFile, 'utf8');
    expect(content).toContain('HTTP Method:    GET');
    expect(content).toContain('URL:            /api/hoteles');
    expect(content).toContain('Status Code:    500');
    expect(content).toContain('Exception Type: InternalServerErrorException');
    expect(content).toContain('Message:        Error de conexión simulado');
    expect(content).toContain('Error: Error de conexión');
  });

  it('debe acumular múltiples entradas en errors.txt usando append', () => {
    const today = new Date().toISOString().slice(0, 10);
    service.writeErrorLog({
      method: 'POST',
      url: '/api/auth/login',
      statusCode: 401,
      exceptionType: 'UnauthorizedException',
      message: 'Credenciales inválidas',
    });

    service.writeErrorLog({
      method: 'DELETE',
      url: '/api/hoteles/999',
      statusCode: 404,
      exceptionType: 'NotFoundException',
      message: 'Hotel no encontrado',
    });

    const expectedFile = join(testLogsDir, today, 'errors.txt');
    const content = readFileSync(expectedFile, 'utf8');

    expect(content).toContain('Credenciales inválidas');
    expect(content).toContain('Hotel no encontrado');
    expect(content.split('--------------------------------------------------------------------------------').length).toBeGreaterThan(3);
  });

  it('debe eliminar carpetas de logs con más de 10 días de antigüedad', () => {
    // Carpeta antigua (15 días atrás)
    const oldDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const oldDir = join(testLogsDir, oldDate);
    mkdirSync(oldDir, { recursive: true });
    writeFileSync(join(oldDir, 'errors.txt'), 'log viejo');

    // Carpeta reciente (2 días atrás)
    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const recentDir = join(testLogsDir, recentDate);
    mkdirSync(recentDir, { recursive: true });
    writeFileSync(join(recentDir, 'errors.txt'), 'log reciente');

    const deletedCount = service.cleanupOldLogs(10);

    expect(deletedCount).toBe(1);
    expect(existsSync(oldDir)).toBe(false);
    expect(existsSync(recentDir)).toBe(true);
  });
});

