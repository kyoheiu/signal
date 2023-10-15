import jwt from "jsonwebtoken";
import * as OTPAuth from "otpauth";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import { encrypt, decrypt } from "../server/crypt.js";
import { base32 } from "rfc4648";
import type { Hash } from "~/type.js";
import { json } from "@remix-run/node";
import { rateLimited, writeFailedAttempt } from "./rateLimit.js";

interface Register {
  dn: string;
  secret: Hash;
}

type Success = "success";

export const JWT_SECRET = process.env.SIGNAL_JWT_SECRET as string;

const createTOTP = (dn: string, secret: string) =>
  new OTPAuth.TOTP({
    issuer: "signal",
    label: dn,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret,
  });

export const loadSecret = async (dn: string) => {
  let uri = undefined;

  const secret = await getSecretRegistered(dn);
  if (!secret) {
    // If .register does not have corresponding secret,
    // generate it and uri.
    const secret: Hash = encrypt(generateCode());
    // Save it to the temp file.
    await saveRegister(dn, secret, true);
    uri = generateUri(dn, secret);
  }

  // If uri is not undefined, it means you haven't registered the qrcode yet.
  const res = {
    uri: uri,
  };
  return json(res);
};

export const getSecretRegistered = async (dn: string): Promise<Hash | null> => {
  try {
    const files = await fs.readdir("./data");
    for (let i = 0; i < files.length; i++) {
      if (files[i] === `.register_${dn}`) {
        console.log(`dn found: ${dn}`);
        const str = await fs.readFile(`./data/${files[i]}`, {
          encoding: "utf8",
        });
        const reg: Register = JSON.parse(str);
        return reg.secret;
      } else {
        continue;
      }
    }

    // If dn is not found in regsiter, just return null.
    return null;
  } catch (e) {
    return null;
  }
};

export const getSecretTemp = async (dn: string): Promise<Hash | null> => {
  try {
    const temp = await fs.readFile(tempFile(dn), { encoding: "utf8" });
    const reg: Register = JSON.parse(temp);
    return reg.secret;
  } catch (e) {
    return null;
  }
};

const generateUri = (dn: string, secret: Hash): string => {
  let totp = createTOTP(dn, decrypt(secret));
  let uri = totp.toString();
  console.log(`Generated uri: ${uri}`);
  return uri;
};

const generateCode = (): string => {
  const array = crypto.getRandomValues(new Uint32Array(16));
  return base32.stringify(array, { pad: false });
};

export const verifyTOTPSession = (token: string) => {
  try {
    jwt.verify(token, JWT_SECRET);
    console.log("Session verified.");
    return true;
  } catch (e) {
    console.log("Invalid session.");
    return false;
  }
};

export const validateTOTPCode = async (
  dn: string,
  num: string,
  secret: Hash,
): Promise<Success | string> => {
  if (await rateLimited(dn)) {
    const message = "Rate limited: Wait a moment.";
    return message;
  }
  let totp = createTOTP(dn, decrypt(secret));
  if (totp.validate({ token: num, window: 1 }) === null) {
    const message = "Invalid code.";
    console.log(message);
    await writeFailedAttempt(dn);
    return message;
  } else {
    console.log("Code verified.");
    return "success";
  }
};

export const saveRegister = async (dn: string, secret: Hash, temp: boolean) => {
  const fileName = temp ? tempFile(dn) : registerFile(dn);

  await fs.mkdir("./data", { recursive: true });
  await fs.writeFile(fileName, JSON.stringify({ dn: dn, secret: secret }));
  console.log(temp ? "Updated temp file." : "Updated register.");
};

export const tempFile = (dn: string) => `./data/.temp_${dn}`;
const registerFile = (dn: string) => `./data/.register_${dn}`;
