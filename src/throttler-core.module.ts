import { createConfigurableDynamicRootModule } from '@golevelup/nestjs-modules';
import { Module } from '@nestjs/common';
import { ThrottlerStorage } from './throttler-storage.interface';
import { THROTTLER_OPTIONS } from './throttler.constants';
import { ThrottlerOptions } from './throttler.interface';
import { ThrottlerStorageService } from './throttler.service';

@Module({})
export class ThrottlerCoreModule extends createConfigurableDynamicRootModule<
  ThrottlerCoreModule,
  ThrottlerOptions
>(THROTTLER_OPTIONS, {
  providers: [
    {
      provide: ThrottlerStorage,
      inject: [THROTTLER_OPTIONS],
      useFactory: (options: ThrottlerOptions) => {
        return options.storage ? options.storage : new ThrottlerStorageService();
      },
    },
  ],
}) {}
