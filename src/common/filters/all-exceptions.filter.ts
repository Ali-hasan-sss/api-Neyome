import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let logMessage: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      // res can be string or object; normalize to message string
      if (typeof res === 'string') {
        message = res;
      } else if (res && (res.message || res.error)) {
        message = Array.isArray(res.message) ? res.message.join(', ') : (res.message || res.error);
      } else {
        message = exception.message;
      }
    } else if (exception && typeof exception === 'object') {
      const err = exception as any;
      const errStatus = Number(err.status ?? err.statusCode);
      // http-errors (e.g. malformed JSON body) mark client-safe 4xx errors with `expose: true`.
      if (err.expose === true && errStatus >= 400 && errStatus < 500) {
        status = errStatus;
        message = err.message || message;
      } else {
        // Internal details (DB, DNS, SMTP, ...) stay in the server log only.
        logMessage = err.message;
      }
    }

    // Log full exception for diagnostics
    this.logger.error(logMessage ?? message, (exception as any)?.stack || undefined);

    response.status(status).json({ success: false, data: null, message });
  }
}
