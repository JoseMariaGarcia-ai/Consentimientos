import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

const BUCKET = () => process.env.R2_BUCKET_NAME ?? 'consentspro-storage'

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  await client().send(new PutObjectCommand({
    Bucket: BUCKET(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
}

export async function deleteFile(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET(), Key: key }))
}

export async function listFiles(prefix: string) {
  const res = await client().send(new ListObjectsV2Command({ Bucket: BUCKET(), Prefix: prefix }))
  return (res.Contents ?? []).map(o => o.Key!)
}

export interface FileListingEntry { key: string; size: number; lastModified: Date | null }

// Igual que listFiles, pero con tamaño y fecha — necesario para el panel de
// Backups (columnas Tamaño/Fecha) sin tener que descargar cada archivo.
export async function listFilesWithMetadata(prefix: string): Promise<FileListingEntry[]> {
  const res = await client().send(new ListObjectsV2Command({ Bucket: BUCKET(), Prefix: prefix }))
  return (res.Contents ?? []).map(o => ({ key: o.Key!, size: o.Size ?? 0, lastModified: o.LastModified ?? null }))
}

export async function getPresignedUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: BUCKET(), Key: key }), { expiresIn })
}

export async function downloadFile(key: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await client().send(new GetObjectCommand({ Bucket: BUCKET(), Key: key }))
  const stream = res.Body as any
  const chunks: Uint8Array[] = []
  for await (const chunk of stream) chunks.push(chunk)
  return {
    buffer: Buffer.concat(chunks),
    contentType: res.ContentType ?? 'application/octet-stream',
  }
}
