import { Prisma } from 'prisma-client';

export function withDbNull<TValue>(
  val: TValue
): Exclude<TValue, null | string> | typeof Prisma.DbNull {
  if (val === null) {
    return Prisma.DbNull;
  } else {
    return val as Exclude<TValue, null | string>;
  }
}

export type AcceptNullForField<
  TKey extends string,
  TInput extends { [key in TKey]?: unknown }
> = Omit<TInput, TKey> & { [key in TKey]?: TInput[TKey] | null };

export type WithoutNull<
  TKey extends string,
  TInput extends { [key in TKey]: unknown }
> = Omit<TInput, TKey> & { [key in TKey]: Exclude<TInput[TKey], null> };
