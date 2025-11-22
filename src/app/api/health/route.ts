import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../../lib/mongodb';
import getRedisClient from '../../../../lib/redis';
import { verifyEmailConfig } from '../../../../lib/email';

// Utility: timeout wrapper
const withTimeout = <T>(promise: Promise<T>, ms: number, name: string) =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)
    ),
  ]);

export async function GET(request: NextRequest) {
  const start = Date.now();

  // Log the requester's IP and user-agent for monitoring
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  console.log(`[HealthCheck] Request from ${ip} - User-Agent: ${request.headers.get('user-agent')}`);

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    responseTime: 0,
    checks: {
      database: "unknown",
      redis: "unknown",
      email: "unknown",
      filesystem: "healthy",
    },
  };

  try {
    // Run checks in parallel
    const [dbRes, redisRes, emailRes] = await Promise.allSettled([
      withTimeout(dbConnect(), 1500, "MongoDB"),
      withTimeout(getRedisClient().then(r => r.ping()), 1500, "Redis"),
      withTimeout(verifyEmailConfig(), 1000, "EmailConfig")
    ]);

    // MongoDB
    if (dbRes.status === "fulfilled") {
      health.checks.database = "healthy";
    } else {
      console.error("[HealthCheck] MongoDB:", dbRes.reason);
      health.checks.database = "unhealthy";
      health.status = "degraded";
    }

    // Redis
    if (redisRes.status === "fulfilled") {
      health.checks.redis = "healthy";
    } else {
      console.error("[HealthCheck] Redis:", redisRes.reason);
      health.checks.redis = "unhealthy";
      health.status = "degraded";
    }

    // Email config
    if (emailRes.status === "fulfilled") {
      health.checks.email = "healthy";
    } else {
      console.warn("[HealthCheck] Email config:", emailRes.reason);
      health.checks.email = "degraded"; // not critical
    }

    health.responseTime = Date.now() - start;

    // Status code based on overall health
    const statusCode =
      health.status === "healthy" ? 200 :
      health.status === "degraded" ? 200 :
      503;

    return NextResponse.json(health, { status: statusCode });

  } catch (err) {
    console.error("[HealthCheck] Critical error:", err);

    return NextResponse.json(
      {
        ...health,
        status: "unhealthy",
        error: err instanceof Error ? err.message : "Unknown error",
        responseTime: Date.now() - start,
      },
      { status: 503 }
    );
  }
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "X-Health-Status": "healthy",
      "X-Timestamp": new Date().toISOString(),
      "X-Uptime": process.uptime().toString(),
      "X-Environment": process.env.NODE_ENV || "development",
      "X-Node-Version": process.version,
    },
  });
}
