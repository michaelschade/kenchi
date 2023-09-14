export type Success<TData> = { success: true; data: TData };
export type Failure<TError> = { success: false; error: TError };

type Result<TData, TError> = Success<TData> | Failure<TError>;

export const isSuccess = <TData>(
  result: Result<TData, unknown>
): result is Success<TData> => result.success;

export const isFailure = <TError>(
  result: Result<unknown, TError>
): result is Failure<TError> => !result.success;

export const success = <TData>(data: TData): Success<TData> => ({
  success: true,
  data,
});

export const failure = <TError>(error: TError): Failure<TError> => ({
  success: false,
  error,
});

export default Result;
