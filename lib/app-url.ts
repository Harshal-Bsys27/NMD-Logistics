export function getAppUrl(requestUrl: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appUrl = new URL(configuredUrl || requestUrl);

  if (appUrl.protocol !== 'http:' && appUrl.protocol !== 'https:') {
    throw new Error('NEXT_PUBLIC_APP_URL must use HTTP or HTTPS.');
  }

  return appUrl;
}
