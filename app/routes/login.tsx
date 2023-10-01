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
        <div className="flex flex-col items-center">
          <div className="text-center text-3xl italic font-extrabold mb-8">
            signal
          </div>
          <div className="text-center text-xl italic font-extrabold mb-4">
            Enter the code below.
          </div>
          <Form
            action="/totp"
            method="post"
            className="flex flex-col items-center mb-6"
          >
            <input
              className="rounded w-56 mb-3 bg-neutral-600 p-2"
              type="text"
              name="digit"
              autoComplete="off"
            />
            <button type="submit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </Form>
          <details className="w-64">
            <summary>Haven't you register to your app?</summary>
            <div className="flex flex-col items-center">
              <img className="my-4" src={png} />
              Read this QR code by your favorite authenticator app.
            </div>
          </details>
        </div>
      </>
    );
  } else {
    return (
      <div>
        <div className="text-center text-3xl italic font-extrabold mb-8">
          signal
        </div>
        <Form
          method="post"
          onSubmit={handleSubmit}
          className="flex flex-col items-center"
        >
          <input
            className="rounded w-56 mb-3 bg-neutral-600 p-2"
            name="username"
            type="text"
            placeholder="Username"
          />
          <input
            className="rounded w-56 mb-6 bg-neutral-600 p-2"
            name="password"
            type="password"
            placeholder="Password"
          />
          <button type="submit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </Form>
      </div>
    );
  }
}
