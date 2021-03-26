import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

export interface ThrottlerModuleOptions {
  /**
   * The amount of requests that are allowed within the ttl's time window.
   */
  limit?: number;

  /**
   * The amount of seconds of how many requests are allowed within this time.
   */
  ttl?: number;

  /**
   * The user agents that should be ignored (checked against the User-Agent header).
   */
  ignoreUserAgents?: RegExp[];

  /**
   * A function to generate a unique identifier for each incoming request. Defaults to ip.
   */
  keyGenerator?: (req: Record<string, any>) => string;

  /**
   * The storage class to use where all the record will be stored in.
   */
  storage?: any;
}

export interface ThrottlerOptionsFactory {
  createThrottlerOptions(): Promise<ThrottlerModuleOptions> | ThrottlerModuleOptions;
}

export interface ThrottlerAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<ThrottlerOptionsFactory>;
  useClass?: Type<ThrottlerOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<ThrottlerModuleOptions> | ThrottlerModuleOptions;
  inject?: any[];
}
