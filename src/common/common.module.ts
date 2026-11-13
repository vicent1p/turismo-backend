import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LogWriterService } from './services/log-writer.service';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

@Module({
  providers: [
    LogWriterService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [LogWriterService],
})
export class CommonModule {}

