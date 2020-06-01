import { CanActivate, ExecutionContext, Inject, Injectable, RequestMethod } from '@nestjs/common';
import { RouteInfo } from '@nestjs/common/interfaces/middleware';
import { Reflector } from '@nestjs/core';
import * as md5 from 'md5';
import { pathToRegexp } from 'path-to-regexp';
import { ThrottlerStorage } from './throttler-storage.interface';
import {
  THROTTLER_LIMIT,
  THROTTLER_OPTIONS,
  THROTTLER_SKIP,
  THROTTLER_TTL,
} from './throttler.constants';
import { ThrottlerException } from './throttler.exception';
import { ThrottlerOptions } from './throttler.interface';

type RouteInfoRegex = RouteInfo & { regex: RegExp };

@Injectable()
export class ThrottlerGuard implements CanActivate {
  constructor(
    @Inject(THROTTLER_OPTIONS) private readonly options: ThrottlerOptions,
    @Inject(ThrottlerStorage) private readonly storageService: ThrottlerStorage,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const classRef = context.getClass();
    const headerPrefix = 'X-RateLimit';

    // Return early if the current route should be skipped.
    if (this.reflector.getAllAndOverride<boolean>(THROTTLER_SKIP, [handler, classRef])) {
      return true;
    }

    // Return early when we have no limit or ttl data.
    const routeOrClassLimit = this.reflector.getAllAndOverride<number>(THROTTLER_LIMIT, [
      handler,
      classRef,
    ]);
    const routeOrClassTtl = this.reflector.getAllAndOverride<number>(THROTTLER_TTL, [
      handler,
      classRef,
    ]);

    // Check if specific limits are set at class or route level, otherwise use global options.
    const limit = routeOrClassLimit || this.options.limit;
    const ttl = routeOrClassTtl || this.options.ttl;
    /* if (typeof limit === 'undefined' || typeof ttl === 'undefined') {
      return true;
    } */

    // Here we start to check the amount of requests being done against the ttl.
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const key = md5(`${req.ip}-${classRef.name}-${handler.name}`);
    const record = this.storageService.getRecord(key);
    const nearestExpiryTime =
      record.length > 0 ? Math.ceil((record[0].getTime() - new Date().getTime()) / 1000) : 0;

    // Throw an error when the user reached their limit.
    if (record.length >= limit) {
      res.header('Retry-After', nearestExpiryTime);
      throw new ThrottlerException();
    }

    res.header(`${headerPrefix}-Limit`, limit);
    // We're about to add a record so we need to take that into account here, otherwise
    // the header says we have a request left when there are none
    res.header(`${headerPrefix}-Remaining`, Math.max(0, limit - (record.length + 1)));
    res.header(`${headerPrefix}-Reset`, nearestExpiryTime);

    this.storageService.addRecord(key, ttl);
    return true;
  }
}
