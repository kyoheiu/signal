import jwt from "jsonwebtoken";
import { authenticate } from "ldap-authentication";

export const validateCredentials = async (
  dn: string,
  pw: string,
): Promise<string | null> => {
  let isInvalid = false;
  try {
    await authenticate({
      ldapOpts: { url: process.env.LDAP_URL },
      userDn: dn,
      userPassword: pw,
    });
  } catch (e) {
    console.error(`Error: ${e}`);
    isInvalid = true;
  }
  if (isInvalid) {
    console.log("returning null...");
    return null;
  }
  const token = jwt.sign({ token: "verified" }, "shhhhh");
  return token;
};
