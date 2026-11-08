const APP_ORIGIN = "https://lotto-analysis.invalid";

export function getSafeRedirectPath(destination: string | null): string {
  if (!destination) return "/";

  try {
    const target = new URL(destination, APP_ORIGIN);

    if (target.origin !== APP_ORIGIN) return "/";

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}
