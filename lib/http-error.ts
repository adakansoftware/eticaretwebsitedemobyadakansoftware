export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function getHttpErrorStatus(error: unknown, fallbackStatus = 400) {
  if (error instanceof HttpError) {
    return error.status;
  }

  return fallbackStatus;
}
