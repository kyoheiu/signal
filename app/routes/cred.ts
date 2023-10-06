import { type ActionFunction, json } from "@remix-run/node";
import { encodeURI } from "js-base64";
import { validateCredentials } from "~/server/cred";

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