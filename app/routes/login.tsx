import { ActionFunction, redirect } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { commitSession, getSession } from "~/sessions.server";
import { validateCredentials } from "./token.server";

export let action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const dn = (form.get("dn") as string) ?? "";
  const pw = (form.get("pw") as string) ?? "";

  const token = await validateCredentials(dn, pw);
  if (!token) {
    session.flash("error", "Invalid credentials");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else {
    session.set("token", token);
    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
};

export default function logIn() {
  return (
    <div>
      <Form method="post" className="flex flex-col">
        <input
          className="border rounded"
          name="dn"
          type="text"
          placeholder="DN"
        />
        <input
          className="border rounded"
          name="pw"
          type="password"
          placeholder="Password"
        />
        <button type="submit">GO</button>
      </Form>
    </div>
  );
}
