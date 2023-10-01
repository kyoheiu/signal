import * as OTPAuth from "otpauth";
import * as qrcode from "qrcode";
import jwt from "jsonwebtoken";
import { ActionFunction, redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/sessions.server";

const SECRET = process.env.SIGNAL_TOTP_SECRET as string;

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const digit = (form.get("digit") as string) ?? "";
  if (varidateTOTP(digit)) {
    const token = jwt.sign({ totp: "verified" }, SECRET);
    console.log(`new token is ${token}`);
    session.set("signal_session", token);
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else {
    session.flash("error", "Invalid digit");
    return redirect("/login");
  }
};

export const generatePng = () => {
  let totp = new OTPAuth.TOTP({
    issuer: "ACME",
    label: "signal",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: SECRET,
  });
  let uri = totp.toString();
  qrcode.toFile("./temp.png", uri, {
    errorCorrectionLevel: "H",
  });
  console.log("Generated png file.");
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

export const varidateTOTP = (token: string): boolean => {
  let totp = new OTPAuth.TOTP({
    issuer: "ACME",
    label: "signal",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: SECRET,
  });
  if (totp.validate({ token, window: 1 }) !== null) {
    console.log("TOTP verified.");
    return true;
  } else {
    console.log("Invalid TOTP.");
    return false;
  }
};
