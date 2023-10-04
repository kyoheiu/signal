import { LoaderFunction, MetaFunction, redirect } from "@remix-run/node";
import { Form, useNavigate } from "@remix-run/react";
import { commitSession, getSession } from "~/sessions.server";
import { verifyTOTPSession } from "./totp";
import { verifiedAtom } from "./jotai";
import { useAtom } from "jotai";
import { Title } from "./Title";
import { SubmitButton } from "./SubmitButton";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [{ title: "signal" }];
};

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
  const navigate = useNavigate();
  const [verified, setVerified] = useAtom(verifiedAtom);
  const [dn, setDn] = useState("");
  const [password, setPassword] = useState("");
  const [warning, setWarning] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await fetch("/cred", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dn: dn, password: password }),
    });
    if (res.ok) {
      setVerified(() => true);
      const j = await res.json();
      console.log(j);
      navigate(j.to);
    } else {
      setWarning(() => "Incorrect dn or password.");
    }
  };

  return (
    <div>
      <Title />
      <Form
        method="post"
        onSubmit={handleSubmit}
        className="flex flex-col items-center"
      >
        <input
          className="rounded w-56 mb-3 bg-neutral-600 p-2"
          name="dn"
          value={dn}
          onChange={(e) => setDn(() => e.target.value)}
          type="text"
          placeholder="Username"
        />
        <input
          className="rounded w-56 mb-6 bg-neutral-600 p-2"
          name="password"
          value={password}
          onChange={(e) => setPassword(() => e.target.value)}
          type="password"
          placeholder="Password"
        />
        {warning && (
          <div className="bg-neutral-100 text-red-600 mb-6 px-2 py-1">
            {warning}
          </div>
        )}
        <SubmitButton />
      </Form>
    </div>
  );
}
