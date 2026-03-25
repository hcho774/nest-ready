import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto, PaginatedResponseDto } from '../dto/api-response.dto';
import { Serialize } from '../interceptors/serialize.interceptor';

type ApiSerializedResponseOptions = {
  status: number;
  dataType: Type<object>;
  paginated?: boolean;
};

/**
 * Combines Swagger schema documentation and `@Serialize` serialization into one decorator.
 *
 * Documents the full response envelope (`{ success, data, timestamp, requestId }`)
 * in Swagger and applies serialization via the `SerializeInterceptor`.
 *
 * @example
 * // Single object response
 * @Get(':id')
 * @ApiSerializedResponse({ status: 200, dataType: UserResponseDto })
 * findOne() { ... }
 *
 * // Paginated response
 * @Get()
 * @ApiSerializedResponse({ status: 200, dataType: UserResponseDto, paginated: true })
 * findAll() { ... }
 */
export function ApiSerializedResponse({
  status,
  dataType,
  paginated = false,
}: ApiSerializedResponseOptions) {
  const envelopeType = paginated ? PaginatedResponseDto : ApiResponseDto;

  return applyDecorators(
    ApiExtraModels(envelopeType, dataType),
    ApiResponse({
      status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(envelopeType) },
          {
            properties: {
              data: paginated
                ? {
                    type: 'array',
                    items: { $ref: getSchemaPath(dataType) },
                  }
                : { $ref: getSchemaPath(dataType) },
            },
          },
        ],
      },
    }),
    Serialize(dataType),
  );
}
