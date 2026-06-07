const sensitiveKeyPattern =
  /password|secret|token|authorization|cookie|set-cookie|smtp_pass|auth_secret|transactionid/i;

function redactString(value: string) {
  if (value.length <= 8) {
    return "[REDACTED]";
  }

  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export function redactLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactLogValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, innerValue]) => {
        if (sensitiveKeyPattern.test(key)) {
          if (typeof innerValue === "string") {
            return [key, redactString(innerValue)];
          }

          return [key, "[REDACTED]"];
        }

        return [key, redactLogValue(innerValue)];
      })
    );
  }

  return value;
}
