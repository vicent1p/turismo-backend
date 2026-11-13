import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService, HealthStatusDto } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** GET /api/health — Unthrottled liveness + database readiness check. */
  @Get('api/health')
  @SkipThrottle()
  async getHealth(): Promise<HealthStatusDto> {
    return this.appService.checkHealth();
  }
}
