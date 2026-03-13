import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { logger, generateRequestId } from "./logger";

export type RouteHandler = (
  request: NextRequest,
  context: any
) => Promise<Response>;

export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context: any) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const route = request.nextUrl.pathname;
    const method = request.method;
    const ip = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    logger.info(`${method} ${route}`, {
      requestId,
      context: {
        route,
        method,
        ip,
        userAgent,
      },
    });

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      logger.info(`${method} ${route} → ${response.status}`, {
        requestId,
        duration,
        context: {
          route,
          method,
          status: response.status,
        },
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`${method} ${route} FAILED`, error, {
        requestId,
        duration,
        context: {
          route,
          method,
        },
      });

      return NextResponse.json(
        { error: "Internal server error", requestId },
        { status: 500 }
      );
    }
  };
}
