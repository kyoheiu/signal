import { ActionFunction } from "@remix-run/node";
import jwt from "jsonwebtoken";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const username = (form.get("username") as string) ?? "";
  const password = (form.get("password") as string) ?? "";

  if (validateCredentials(username, password)) {
    return new Response(null, {
      status: 200,
    });
  } else {
    return new Response("Invalid credentials.", {
      status: 400,
    });
  }
};

export const validateCredentials = async (username: string, password: string) => {
  try {
    await authenticate({
      ldapOpts: {url: process.env.SIGNAL_LDAP_URL as string},
      userDn: username,
      userPassword: password
    });
    console.log("Credentials verified.");
    return true;
  } catch (e) {
    console.log(e);
    console.log("Invalid credentials.");
    return false;
  }
};
