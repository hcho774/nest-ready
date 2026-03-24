import {
  UseInterceptors,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  Type,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { plainToInstance } from 'class-transformer';

type Paginated<T> = {
  items: T[];
  meta: Record<string, unknown>;
};

type SerializableInput<T> = T | T[] | Paginated<T> | null | undefined;
type SerializableOutput<T> = T | T[] | Paginated<T> | null | undefined;

const SERIALIZE_OPTIONS = {
  excludeExtraneousValues: true,
  exposeUnsetFields: false,
  exposeDefaultValues: true,
  enableImplicitConversion: true,
};

class SerializeInterceptor<T extends object>
  implements NestInterceptor<SerializableInput<unknown>, SerializableOutput<T>>
{
  constructor(private readonly classType: Type<T>) {}

  private serialize(data: object | object[]): T | T[] {
    return plainToInstance(this.classType, data, SERIALIZE_OPTIONS);
  }

  private isPaginated(value: unknown): value is Paginated<object> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'items' in value &&
      Array.isArray((value as { items: unknown }).items)
    );
  }

  private transform(data: SerializableInput<object>): SerializableOutput<T> {
    if (data == null) return data;

    if (Array.isArray(data)) {
      return this.serialize(data);
    }

    if (this.isPaginated(data)) {
      return {
        ...data,
        items: this.serialize(data.items) as T[],
      };
    }

    return this.serialize(data);
  }

  intercept(
    _context: ExecutionContext,
    next: CallHandler<SerializableInput<object>>,
  ): Observable<SerializableOutput<T>> {
    return next.handle().pipe(map((data) => this.transform(data)));
  }
}

export function Serialize<T extends object>(classType: Type<T>) {
  return UseInterceptors(new SerializeInterceptor<T>(classType));
}
