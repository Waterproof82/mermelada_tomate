import { SignJWT } from 'jose';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function generateToken() {
  const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
  const token = await new SignJWT({ origin: 'admin_script' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(secret);
  console.log(`https://tuweb.com/?access=${token}`);
}

generateToken();
