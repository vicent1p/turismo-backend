import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { LogWriterService } from '../services/log-writer.service';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logWriterMock: jest.Mocked<LogWriterService>;

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockHost = (request: any, response: any) => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as any;
  };

  beforeEach(() => {
    logWriterMock = {
      writeErrorLog: jest.fn(),
    } as unknown as jest.Mocked<LogWriterService>;

    filter = new AllExceptionsFilter(logWriterMock);
  });

  it('debe capturar HttpException y responder con su statusCode y mensaje correspondiente', () => {
    const res = mockResponse();
    const req = { url: '/api/hoteles', method: 'GET' };
    const host = mockHost(req, res);

    const exception = new BadRequestException('El nombre del hotel es obligatorio');

    filter.catch(exception, host);

    expect(logWriterMock.writeErrorLog).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/api/hoteles',
        statusCode: HttpStatus.BAD_REQUEST,
        exceptionType: 'BadRequestException',
        message: 'El nombre del hotel es obligatorio',
      }),
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/api/hoteles',
        message: 'El nombre del hotel es obligatorio',
      }),
    );
  });

  it('debe capturar excepciones no-Http (Error nativo) y devolver statusCode 500', () => {
    const res = mockResponse();
    const req = { url: '/api/usuarios', method: 'POST' };
    const host = mockHost(req, res);

    const exception = new Error('Database connection failed unexpectedly');

    filter.catch(exception, host);

    expect(logWriterMock.writeErrorLog).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/usuarios',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        exceptionType: 'Error',
        message: 'Database connection failed unexpectedly',
      }),
    );

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/api/usuarios',
        message: 'Database connection failed unexpectedly',
      }),
    );
  });

  it('debe manejar excepciones no-objeto primitivas', () => {
    const res = mockResponse();
    const req = { url: '/api/crash', method: 'DELETE' };
    const host = mockHost(req, res);

    filter.catch('Uncaught string throw', host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(logWriterMock.writeErrorLog).toHaveBeenCalled();
  });
});

