import { Form, useLoaderData } from "@remix-run/react";
import png from "../../temp.png";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/sessions.server";
import { verifyFirst } from "./cred";
import { generatePng, is2faEnabled } from "./otp";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("signal_first")) {
    const token = session.get("signal_first");
    console.log(token);
    if (verifyFirst(token)) {
      generatePng();
      return null;
    } else {
      session.flash("error", "Invalid credentials");
      return redirect("/login");
    }
  } else {
    return redirect("/login");
  }
};

export default function totp() {
  return (
    <>
      <div>
        <details>
          <summary>Show QR code</summary>
          <img src={png} />
        </details>
        After reading the code above on your authenticator app (such as Google
        Authenticator), enter the number below.
        <Form action="/otp" className="flex flex-col">
          <input
            className="border rounded"
            type="text"
            name="digit"
            autoComplete="off"
          />
          <button type="submit">Do it</button>
        </Form>
      </div>
    </>
  );
}
