export function logError(context, error, meta) {
  try {
    const info = {
      context,
      message: error?.message ?? String(error),
      name: error?.name,
      stack: error?.stack,
      ...(meta ? { meta } : {}),
    }
    console.error('Error:', info)
  } catch (loggingErr) {
    console.error('Error while logging error', loggingErr)
  }
}
