import { NextResponse } from 'next/server';

// NestJS error shape: { statusCode, message, error }
// The frontend reads `errorData.message` and `response.status`, so we
// must reproduce this shape exactly to avoid breaking existing error handling.

const REASONS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
};

/**
 * Throw this from service/route logic to produce a typed HTTP error.
 * The `withAuth` wrapper (and route-level catch blocks) convert it to JSON.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly messages: string | string[];

  constructor(statusCode: number, message: string | string[]) {
    super(Array.isArray(message) ? message.join('; ') : message);
    this.statusCode = statusCode;
    this.messages = message;
    this.name = 'ApiError';
  }
}

/**
 * Build a NextResponse matching the NestJS error JSON shape.
 */
export function errorResponse(
  statusCode: number,
  message: string | string[],
): NextResponse {
  return NextResponse.json(
    {
      statusCode,
      message,
      error: REASONS[statusCode] ?? 'Error',
    },
    { status: statusCode },
  );
}

/**
 * Convert a caught value into a NestJS-shaped error response.
 * ApiError → its status + message; anything else → 500.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return errorResponse(error.statusCode, error.messages);
  }

  console.error('[Route Handler] Unexpected error:', error);
  return errorResponse(500, 'Internal Server Error');
}
