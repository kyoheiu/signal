import { authenticate } from "ldap-authentication";

export const validateCredentials = async (
  dn: string,
  password: string,
): Promise<boolean | string> => {
  try {
    await authenticate({
      ldapOpts: { url: process.env.SIGNAL_LDAP_URL as string },
      userDn: dn,
      userPassword: password,
    });
    console.log("Credentials verified.");
    return true;
  } catch (e) {
    console.log(e);
    return e as string;
  }
};
