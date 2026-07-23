// Redimensiona y recodifica una imagen en el propio navegador antes de
// subirla — evita que una foto de cámara de varios MB (que se manda como
// base64 dentro de un JSON, ~33% más pesada que el archivo original) se
// acerque al límite de tamaño del body del servidor. Si falla (formato no
// soportado por el navegador, etc.) quien llame debe hacer fallback al
// archivo original.
export function compressImage(file: File, maxDimension: number, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas no soportado')); return }
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('no se pudo comprimir')), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('no se pudo leer la imagen')) }
    img.src = objectUrl
  })
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
