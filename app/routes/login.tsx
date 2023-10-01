import { LoaderFunction, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { commitSession, getSession } from "~/sessions.server";
import { FormEvent, useState } from "react";
import png from "../../temp.png";
import { verifyTOTPSession } from "./totp";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("signal_session")) {
    const token = session.get("signal_session");
    console.log(token);
    if (verifyTOTPSession(token)) {
      return redirect("/", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    } else {
      console.log("Invalid session.");
      session.flash("error", "Invalid credentials");
      return null;
    }
  } else {
    return null;
  }
};

export default function logIn() {
  const [credentialsVerified, setCredentialsVerified] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const res = await fetch("/cred", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      setCredentialsVerified(() => true);
    }
  };

  if (credentialsVerified) {
    return (
      <>
        <div>
          <details>
            <summary>Show QR code</summary>
            <img src={png} />
          </details>
          After reading the code above on your authenticator app (such as Google
          Authenticator), enter the number below.
          <Form action="/otp" method="post" className="flex flex-col">
            <input
              className="border rounded"
              type="text"
              name="digit"
              autoComplete="off"
            />
            <button type="submit">do it</button>
          </Form>
        </div>
      </>
    );
  }
  return (
    <div>
      <Form method="post" onSubmit={handleSubmit} className="flex flex-col">
        <input
          className="border rounded"
          name="username"
          type="text"
          placeholder="Username"
        />
        <input
          className="border rounded"
          name="password"
          type="password"
          placeholder="Password"
        />
        <button type="submit">GO</button>
      </Form>
    </div>
  );
}
