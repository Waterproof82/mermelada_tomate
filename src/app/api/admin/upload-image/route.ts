import { NextRequest } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, successResponse, errorResponse } from '@/core/infrastructure/api/helpers';
import { getS3Client, getR2Config } from '@/core/infrastructure/storage/s3-client';
import { empresaUseCase } from '@/core/infrastructure/database';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function uploadViaCloudflareAPI(
  accountId: string,
  bucket: string,
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${key}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': contentType,
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Cloudflare API error ${res.status}: ${text}`);
  }
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const { empresaId, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { bucketName, publicDomain } = getR2Config();
  if (!bucketName || !publicDomain) {
    return errorResponse('Configuración de R2 incompleta');
  }

  // Derivar el slug desde la DB (no confiar en el cliente)
  const empresa = await empresaUseCase.getById(empresaId!);
  const empresaSlug = empresa?.slug ?? empresa?.dominio ?? empresaId!;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Error al leer los datos del formulario', 400);
  }

  const file = formData.get('file') as File | null;

  if (!file || !(file instanceof File)) {
    return errorResponse('No se recibió ningún archivo', 400);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return errorResponse('Tipo de archivo no permitido. Solo JPEG, PNG, WEBP o GIF.', 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return errorResponse('El archivo excede el tamaño máximo de 10MB.', 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uuid = uuidv4();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${empresaSlug}/${year}/${month}/${uuid}-${file.name}`;

    const { R2_ACCOUNT_ID } = process.env;

    if (CLOUDFLARE_API_TOKEN && R2_ACCOUNT_ID) {
      // Usar Cloudflare REST API (no requiere r2.cloudflarestorage.com)
      await uploadViaCloudflareAPI(R2_ACCOUNT_ID, bucketName, key, buffer, file.type);
    } else {
      // Fallback: AWS SDK S3-compatible
      const client = getS3Client();
      await client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ContentLength: buffer.byteLength,
        })
      );
    }

    const publicUrl = `${publicDomain}/${key}`;
    return successResponse({ publicUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[upload-image] Error uploading to R2:', msg);
    return errorResponse(`Error al subir la imagen: ${msg}`);
  }
}
