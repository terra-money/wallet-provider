export function isError<E extends Error>(
  error: unknown,
  errorType: { new (...args: any[]): E },
): error is E {
  try {
    return (
      //@ts-ignore
      error instanceof errorType || error.constructor.name === errorType.name
    );
  } catch {
    return false;
  }
}
