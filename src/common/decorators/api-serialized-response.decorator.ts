import { Type, applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { Serialize } from '../interceptors/serialize.interceptor';

type SerializedResponseType = Type<unknown> & {
  serializeType?: Type<object>;
};

type ApiSerializedResponseOptions = {
  status: number;
  responseType: SerializedResponseType;
};

/**
 * Combines `@ApiResponse` and `@Serialize` into one decorator.
 *
 * If `responseType.serializeType` is set, it also applies the `@Serialize`
 * interceptor so the response is automatically shaped to that DTO.
 *
 * @example
 * // Without serializeType (plain Swagger annotation only)
 * @ApiSerializedResponse({ status: 200, responseType: UserResponseDto })
 *
 * // With serializeType (Swagger + serialization)
 * class UserListResponseDto {
 *   static serializeType = UserResponseDto;
 * }
 * @ApiSerializedResponse({ status: 200, responseType: UserListResponseDto })
 */
export function ApiSerializedResponse({
  status,
  responseType,
}: ApiSerializedResponseOptions): MethodDecorator & ClassDecorator {
  if (responseType.serializeType) {
    return applyDecorators(
      ApiResponse({ status, type: responseType }),
      Serialize(responseType.serializeType),
    );
  }

  return applyDecorators(ApiResponse({ status, type: responseType }));
}
