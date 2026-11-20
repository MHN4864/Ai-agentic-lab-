function getEmailError(value: string) {
  const email = value.trim();

  if (!email) {
    return "Enter your email address.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }

  return undefined;
}

function getWebsiteError(value: string) {
  const website = value.trim();
  if (!website) {
    return undefined;
  }

  try {
    const url = new URL(website);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname
    ) {
      return "Enter a valid website address, including https://.";
    }
  } catch {
    return "Enter a valid website address, including https://.";
  }

  return undefined;
}

function clearError<T extends object>(errors: T, key: PropertyKey): T {
  const next = { ...errors };
  Reflect.deleteProperty(next, key);
  return next;
}

export { clearError, getEmailError, getWebsiteError };
