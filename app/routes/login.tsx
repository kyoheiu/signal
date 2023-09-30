import { LoaderFunction, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { commitSession, getSession } from "~/sessions.server";
import { verifyFirst } from "./cred";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("signal_first")) {
    const token = session.get("signal_first");
    console.log(token);
    if (verifyFirst(token)) {
      return redirect("/totp", {
        headers: {
          "Set-Cookie": await commitSession(session),
        },
      });
    } else {
      session.flash("error", "Invalid credentials");
      return null;
    }
  } else {
    return null;
  }
};

export default function logIn() {
  return (
    <div>
      <Form action="/cred" method="post" className="flex flex-col">
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
