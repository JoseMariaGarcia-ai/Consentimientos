// Detección ligera por regex — suficiente para agrupar analítica por
// dispositivo/navegador/SO sin depender de una librería externa.
export function parseUserAgent(ua: string | undefined | null) {
  const s = ua ?? ''

  let device_type = 'desktop'
  if (/tablet|ipad/i.test(s)) device_type = 'tablet'
  else if (/mobi|android(?!.*tablet)|iphone/i.test(s)) device_type = 'mobile'

  let browser = 'Otro'
  if (/edg\//i.test(s)) browser = 'Edge'
  else if (/opr\/|opera/i.test(s)) browser = 'Opera'
  else if (/chrome\//i.test(s) && !/edg\//i.test(s)) browser = 'Chrome'
  else if (/crios\//i.test(s)) browser = 'Chrome'
  else if (/fxios\//i.test(s)) browser = 'Firefox'
  else if (/firefox\//i.test(s)) browser = 'Firefox'
  else if (/safari\//i.test(s) && !/chrome\//i.test(s)) browser = 'Safari'

  let os = 'Otro'
  if (/windows/i.test(s)) os = 'Windows'
  else if (/mac os x|macintosh/i.test(s)) os = 'macOS'
  else if (/android/i.test(s)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(s)) os = 'iOS'
  else if (/linux/i.test(s)) os = 'Linux'

  return { device_type, browser, os }
}
