const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ACCESS_TOKEN_SECRET',
];

const optionalEnvVars = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'NEXT_PUBLIC_R2_DOMAIN',
];

export function validateEnvVars() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('[Config] Variables de entorno faltantes:', missing);
    throw new Error(`Configuración incompleta. Faltan: ${missing.join(', ')}`);
  }

  const missingOptional = optionalEnvVars.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('[Config] Variables opcionales no configuradas:', missingOptional);
  }

  return true;
}

if (process.env.NODE_ENV === 'development') {
  validateEnvVars();
}
