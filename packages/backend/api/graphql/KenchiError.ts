import { enumType, objectType } from 'nexus';
import type { SourceValue } from 'nexus/dist/typegenTypeHelpers';

export const BooleanOutput = objectType({
  name: 'BooleanOutput',
  definition(t) {
    t.boolean('success');
    t.nullable.field('error', { type: 'KenchiError' });
  },
});

export const KenchiErrorType = enumType({
  name: 'KenchiErrorType',
  members: ['authenticationError', 'conflictError', 'validationError'],
});

export const KenchiErrorCode = enumType({
  name: 'KenchiErrorCode',
  members: [
    // authenticationError
    'unauthenticated',
    'insufficientPermission',
    // conflictError
    'alreadyModified',
    // validationError
    'alreadyExists',
    'invalidValue',
    'notFound',
  ],
});

export const KenchiError = objectType({
  name: 'KenchiError',
  definition(t) {
    t.nonNull.field('type', { type: 'KenchiErrorType' });
    t.nonNull.field('code', { type: 'KenchiErrorCode' });
    t.nullable.string('param');
    t.nullable.string('message');
  },
});

export function unauthenticatedError(): SourceValue<'KenchiError'> {
  return {
    type: 'authenticationError',
    code: 'unauthenticated',
    message: 'You must be logged in to do this.',
  };
}

const DEFAULT_PERMISSION_ERROR =
  "You don't have permission to perform this action. If you think you should, contact your team admin to have your account updated.";
export function permissionError(
  message = DEFAULT_PERMISSION_ERROR
): SourceValue<'KenchiError'> {
  return {
    type: 'authenticationError',
    code: 'insufficientPermission',
    message,
  };
}

export function notFoundError(param?: string): SourceValue<'KenchiError'> {
  return {
    type: 'validationError',
    code: 'notFound',
    message: 'This item could not be found.',
    param,
  };
}

export function invalidValueError(
  message: string,
  param?: string
): SourceValue<'KenchiError'> {
  return {
    type: 'validationError',
    code: 'invalidValue',
    message,
    param,
  };
}

export function alreadyModifiedError(): SourceValue<'KenchiError'> {
  return {
    type: 'conflictError',
    code: 'alreadyModified',
    message:
      'Sorry, unfortunately someone else modified this while you were editing it. Please note your edits, refresh the page, and redo them.',
  };
}
