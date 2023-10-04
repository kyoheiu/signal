import { LoaderFunction } from "@remix-run/node";
import { getSession } from "~/sessions.server";
import { verifyTOTPSession } from "./totp";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("signal_session");
  if (verifyTOTPSession(token)) {
    const message = "Session verified.";
    return new Response(message, { status: 200 });
  } else {
    const message = "Failed to verify session.";
    return new Response(message, { status: 400 });
  }
};
