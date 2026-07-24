export class AppError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'bad_request', details)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'forbidden')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message, 'not_found')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(409, message, 'conflict', details)
    this.name = 'ConflictError'
  }
}

export class InternalError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(500, message, 'internal_error', details)
    this.name = 'InternalError'
  }
}

/** Maps a Postgres/PostgREST error (from an RPC or query) to an AppError by SQLSTATE code. */
export function mapPostgrestError(error: { code?: string; message: string }): AppError {
  switch (error.code) {
    case '23505':
      return new ConflictError('A record with this value already exists')
    case '42501':
      return new ForbiddenError('You do not have permission to perform this action')
    case '22023':
      return new BadRequestError(error.message)
    default:
      return new InternalError(error.message, { pgCode: error.code })
  }
}

export function errorToResponse(err: unknown): Response {
  const appError =
    err instanceof AppError
      ? err
      : new InternalError(err instanceof Error ? err.message : 'Unknown error')

  if (!(err instanceof AppError)) {
    console.error('[unhandled_error]', err)
  }

  return new Response(
    JSON.stringify({
      error: { code: appError.code, message: appError.message, details: appError.details },
    }),
    { status: appError.status, headers: { 'Content-Type': 'application/json' } },
  )
}
