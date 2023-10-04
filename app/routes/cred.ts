import { type ActionFunction, json } from "@remix-run/node";
import { authenticate } from "ldap-authentication";
import { encodeURI } from "js-base64";

export const action: ActionFunction = async ({ request }) => {
  const j = await request.json();

  if (await validateCredentials(j.dn, j.password)) {
    const slug = encodeURI(j.dn);
    return json({ to: `/otp/${slug}` });
  } else {
    return new Response("Invalid credentials.", {
      status: 400,
    });
  }
};

export const validateCredentials = async (dn: string, password: string) => {
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
    console.log("Invalid credentials.");
    return false;
  }
};
