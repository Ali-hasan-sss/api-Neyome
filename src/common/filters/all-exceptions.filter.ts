import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

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
      message = (exception as any).message || message;
    }

    // Log full exception for diagnostics
    this.logger.error(message, (exception as any)?.stack || undefined);

    response.status(status).json({ success: false, data: null, message });
  }
}
