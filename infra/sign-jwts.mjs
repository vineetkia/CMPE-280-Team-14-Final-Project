// Usage: node infra/sign-jwts.mjs <JWT_SECRET>
import crypto from "node:crypto";

const secret = process.argv[2];
if (!secret || secret.length < 32) {
  console.error("Pass a JWT_SECRET of at least 32 characters as argv[1].");
  process.exit(1);
}

function sign(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${sig}`;
}

const iat = Math.floor(Date.now() / 1000);
const exp = iat + 60 * 60 * 24 * 365 * 10;

console.log("ANON_KEY=" + sign({ role: "anon", iss: "hyrd", iat, exp }));
console.log("SERVICE_ROLE_KEY=" + sign({ role: "service_role", iss: "hyrd", iat, exp }));
