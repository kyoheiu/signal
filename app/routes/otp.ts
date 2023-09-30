import * as fs from "node:fs/promises";
import * as OTPAuth from "otpauth";
import * as qrcode from "qrcode";
import jwt from "jsonwebtoken";

export const generatePng = () => {
  let totp = new OTPAuth.TOTP({
    issuer: "ACME",
    label: "signal",

    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: process.env.SIGNAL_TOTP_SECRET,
  });
  let uri = totp.toString();
  console.log(uri);
  qrcode.toFile("./temp.png", uri, {
    errorCorrectionLevel: "H",
  });
  console.log("Generated png file.");
};
