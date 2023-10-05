import jwt from "jsonwebtoken";
import { type ActionFunction, json } from "@remix-run/node";
import { commitSession, getSession } from "~/sessions.server";
import * as OTPAuth from "otpauth";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import { encrypt, decrypt } from "../server/crypt.js";
import { base32 } from "rfc4648";
import type { Hash } from "~/type.js";

interface Req {
  dn: string;
  num: string;
  ref: string | null;
}

interface Register {
  dn: string;
  secret: Hash;
}

const JWT_SECRET = process.env.SIGNAL_JWT_SECRET as string;
const REGISTER_PATH = "./data/.register";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const j: Req = await request.json();
  const dn: string = j.dn;

  const secret = await getSecretRegistered(dn);
  if (secret) {
    // If register already has the corresponding secret,
    // just use it.
    if (!validateTOTP(dn, j.num, secret)) {
      session.flash("error", "Invalid digit");
      return new Response(null, {
        status: 400,
      });
    }
  } else {
    console.log("Reading temp file...");
    // If register does not have the secret,
    // read it from the temp file.
    const secret = await getSecretTemp(dn);
    if (!secret) {
      return new Response(null, {
        status: 400,
      });
    } else {
      if (!validateTOTP(dn, j.num, secret)) {
        // Delete temp file when not validated.
        await fs.rm(tempFile(dn));
        console.log("Removed temp file.");
        session.flash("error", "Invalid digit");
        return new Response(null, {
          status: 400,
        });
      }
      // When validated, save it to .register (permanent).
      await saveRegister(dn, secret, false);
      // Delete temp file.
      await fs.rm(tempFile(dn));
      console.log("Removed temp file.");
    }
  }

  // Set session cookie.
  const token = jwt.sign({ totp: "verified" }, JWT_SECRET);
  session.set("signal_session", token);

  return new Response(null, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
};

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
    const secret: Hash = encrypt(generateToken());
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

const getSecretRegistered = async (dn: string): Promise<Hash | null> => {
  try {
    const reg = await fs.readFile(REGISTER_PATH, { encoding: "utf8" });
    const list: Register[] = JSON.parse(reg).list;
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      if (row.dn === dn) {
        console.log(`dn found: ${dn}`);
        return row.secret;
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

const getSecretTemp = async (dn: string): Promise<Hash | null> => {
  try {
    const temp = await fs.readFile(tempFile(dn), { encoding: "utf8" });
    const list: Register[] = JSON.parse(temp).list;
    if (list[0].dn === dn) {
      return list[0].secret;
    } else {
      return null;
    }
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

const generateToken = (): string => {
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

export const validateTOTP = (
  dn: string,
  num: string,
  secret: Hash,
): boolean => {
  let totp = createTOTP(dn, decrypt(secret));
  if (totp.validate({ token: num, window: 1 }) !== null) {
    console.log("TOTP verified.");
    return true;
  } else {
    console.log("Invalid TOTP.");
    return false;
  }
};

const saveRegister = async (dn: string, secret: Hash, temp: boolean) => {
  const fileName = temp ? tempFile(dn) : REGISTER_PATH;

  try {
    await fs.mkdir("./data");
    const reg = await fs.readFile(fileName, { encoding: "utf8" });
    const lists: Register[] = JSON.parse(reg).list;
    lists.push({ dn: dn, secret: secret });
    await fs.writeFile(fileName, JSON.stringify({ list: lists }));
    console.log(temp ? "Updated temp file." : "Updated register.");
  } catch (e) {
    await fs.writeFile(
      fileName,
      JSON.stringify({ list: [{ dn: dn, secret: secret }] }),
    );
    console.log(temp ? "Created temp file." : "Created register.");
  }
};

const tempFile = (dn: string) => `./data/.temp_${dn}`;
