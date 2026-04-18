import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiCreatedResponse, getSchemaPath, ApiQuery, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse } from '@nestjs/swagger';

export function ApiOkWrappedResponse<TModel extends Type<any>>(model: TModel, example: any) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OK' },
          data: { $ref: getSchemaPath(model) },
        },
      },
      examples: {
        default: { summary: 'Wrapped success response', value: { success: true, message: 'OK', data: example } },
      },
    }),
  );
}

export function ApiCreatedWrappedResponse<TModel extends Type<any>>(model: TModel, example: any) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiCreatedResponse({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Created' },
          data: { $ref: getSchemaPath(model) },
        },
      },
      examples: {
        default: { summary: 'Wrapped created response', value: { success: true, message: 'Created', data: example } },
      },
    }),
  );
}

export function ApiOkWrappedPaginatedResponse<TModel extends Type<any>>(model: TModel, example: any) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Fetched' },
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: getSchemaPath(model) } },
              total: { type: 'number', example: 1 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
            },
          },
        },
      },
      examples: {
        default: { summary: 'Wrapped paginated response', value: { success: true, message: 'Fetched', data: example } },
      },
    }),
  );
}

export function ApiPaginationQueries() {
  return applyDecorators(
    ApiQuery({ name: 'page', required: false, schema: { type: 'number', default: 1 } }),
    ApiQuery({ name: 'limit', required: false, schema: { type: 'number', default: 20 } }),
    ApiQuery({ name: 'sortBy', required: false, schema: { type: 'string', default: 'createdAt' } }),
    ApiQuery({ name: 'sortOrder', required: false, schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' } }),
  );
}

function wrappedErrorSchema(exampleMessage: string) {
  return {
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: exampleMessage },
        data: { type: 'null', example: null },
      },
    },
  } as const;
}

export function ApiErrorResponses() {
  return applyDecorators(
    ApiUnauthorizedResponse({
      ...wrappedErrorSchema('Invalid API key'),
      examples: {
        default: { summary: 'Unauthorized', value: { success: false, message: 'Invalid API key', data: null } },
      },
    }),
    ApiBadRequestResponse({
      ...wrappedErrorSchema('Validation failed'),
      examples: {
        default: { summary: 'Bad Request', value: { success: false, message: 'Validation failed', data: null } },
      },
    }),
    ApiNotFoundResponse({
      ...wrappedErrorSchema('Resource not found'),
      examples: {
        default: { summary: 'Not Found', value: { success: false, message: 'Resource not found', data: null } },
      },
    }),
    ApiInternalServerErrorResponse({
      ...wrappedErrorSchema('Internal server error'),
      examples: {
        default: { summary: 'Server Error', value: { success: false, message: 'Internal server error', data: null } },
      },
    }),
  );
}
