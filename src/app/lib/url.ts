export function isValidExternalUrl(value: string) {
  if (!value) return false;

  try {
    const target = new URL(value);
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return false;
    }

    const hostname = target.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.local')
    ) {
      return false;
    }

    if (
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function isGitHubRepositoryUrl(value: string) {
  if (!isValidExternalUrl(value)) return false;

  try {
    const target = new URL(value);
    if (target.hostname.toLowerCase() !== 'github.com') {
      return false;
    }

    const pathSegments = target.pathname.split('/').filter(Boolean);
    return pathSegments.length >= 2;
  } catch {
    return false;
  }
}

export function openExternalUrl(value: string) {
  if (!isValidExternalUrl(value)) return;
  window.open(value, '_blank', 'noopener,noreferrer');
}
