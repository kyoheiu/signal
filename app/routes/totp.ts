import jwt from "jsonwebtoken";
import { type ActionFunction } from "@remix-run/node";
import { commitSession, getSession } from "../server/sessions";
import * as fs from "fs/promises";
import {
  JWT_SECRET,
  getSecretRegistered,
  getSecretTemp,
  saveRegister,
  tempFile,
  validateTOTP,
} from "~/server/totp";

interface Req {
  dn: string;
  num: string;
  ref: string | null;
}

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
