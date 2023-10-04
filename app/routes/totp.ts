import jwt from "jsonwebtoken";
import { type ActionFunction, redirect, json } from "@remix-run/node";
import { commitSession, getSession } from "~/sessions.server";
import * as OTPAuth from "otpauth";
import * as fs from "fs/promises";
import * as crypto from "crypto";
import { encrypt, decrypt } from "./crypt.js";
import { base32 } from "rfc4648";
import type { Hash } from "~/type.js";

interface Register {
  dn: string;
  secret: Hash;
}

interface State {
  secret: Hash;
  firstTime: boolean;
}

const SECRET = process.env.SIGNAL_JWT_SECRET as string;

const createTOTP = (secret: string) =>
  new OTPAuth.TOTP({
    issuer: "signal",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret,
  });

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const j = await request.json();
  if (varidateTOTP(j.num, j.hash)) {
    if (j.dn) {
      await saveRegister(j.dn, j.hash, false);
    }

    // Set session cookie.
    const token = jwt.sign({ totp: "verified" }, SECRET);
    session.set("signal_session", token);

    return new Response(null, {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else {
    session.flash("error", "Invalid digit");
    return redirect("/login");
  }
};

export const loadSecret = async (dn: string) => {
  const state = await getSecret(dn);

  let uri = undefined;
  if (state?.firstTime) {
    uri = generateUri(state.secret);
  }

  const res = {
    ...state,
    uri: uri,
  };
  console.log(res);
  return json(res);
};

const getSecret = async (dn: string): Promise<State | null> => {
  try {
    const reg = await fs.readFile("./.register", { encoding: "utf8" });
    const lists: Register[] = JSON.parse(reg).list;
    for (let i = 0; i < lists.length; i++) {
      const row = lists[i];
      if (row.dn === dn) {
        console.log(`dn found: ${dn}`);
        return { secret: row.secret, firstTime: false };
      } else {
        continue;
      }
    }

    // If dn is not found in regsiter, generate secret
    const secret: Hash = encrypt(generateToken());
    return { secret: secret, firstTime: true };
  } catch (e) {
    const secret: Hash = encrypt(generateToken());
    return { secret: secret, firstTime: true };
  }
};

const generateUri = (secret: Hash): string => {
  let totp = createTOTP(decrypt(secret));
  let uri = totp.toString();
  console.log("Generated uri.");
  return uri;
};

const generateToken = (): string => {
  const array = crypto.getRandomValues(new Uint32Array(16));
  return base32.stringify(array, { pad: false });
};

export const verifyTOTPSession = (token: string) => {
  try {
    jwt.verify(token, SECRET);
    console.log("TOTP session verified.");
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const varidateTOTP = (num: string, secret: Hash): boolean => {
  let totp = createTOTP(decrypt(secret));
  if (totp.validate({ token: num, window: 1 }) !== null) {
    console.log("TOTP verified.");
    return true;
  } else {
    console.log("Invalid TOTP.");
    return false;
  }
};

const saveRegister = async (dn: string, secret: Hash, temp: boolean) => {
  const fileName = temp ? "./.temp" : "./.register";

  try {
    const reg = await fs.readFile(fileName, { encoding: "utf8" });
    const lists: Register[] = JSON.parse(reg).list;
    lists.push({ dn: dn, secret: secret });
    await fs.writeFile(fileName, JSON.stringify({ list: lists }));
    console.log("Updated register.");
  } catch (e) {
    await fs.writeFile(
      fileName,
      JSON.stringify({ list: [{ dn: dn, secret: secret }] }),
    );
    console.log("Created register.");
  }
};
