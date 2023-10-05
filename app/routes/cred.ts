import { type ActionFunction, json } from "@remix-run/node";
import { authenticate } from "ldap-authentication";
import { encodeURI } from "js-base64";

export const action: ActionFunction = async ({ request }) => {
  const j = await request.json();

  const result = await validateCredentials(j.dn, j.password);
  if (result === true) {
    const slug = encodeURI(j.dn);
    return json({ to: `/totp/${slug}` });
  } else {
    return new Response(result as string, {
      status: 400,
    });
  }
};

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
