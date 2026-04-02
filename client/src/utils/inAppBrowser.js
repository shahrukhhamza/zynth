/**
 * Detects if the current browser is an in-app browser (Instagram, Facebook, etc.)
 * Google OAuth is intentionally blocked in these embedded WebViews.
 */
export function isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return /Instagram|FBAN|FBAV|FB_IAB|LinkedInApp|Line\/|KAKAOTALK|Snapchat/i.test(ua);
}
