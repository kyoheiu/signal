import { ActionFunction, redirect } from "@remix-run/node";
import { getSession, commitSession } from "~/sessions.server";
import jwt from "jsonwebtoken";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const form = await request.formData();
  const username = (form.get("username") as string) ?? "";
  const password = (form.get("password") as string) ?? "";

  if (!validateCredentials(username, password)) {
    console.log("Invalid credentials.");
    session.flash("error", "Invalid credentials");
    return redirect("/login", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } else {
    const token = jwt.sign({ first: username }, "shhhhh");
    session.set("signal_first", token);
    return redirect("/totp", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }
};

export const verifyFirst = (token: string) => {
  try {
    const payload = jwt.verify(token, "shhhhh");
    console.log(payload);
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const validateCredentials = (username: string, password: string) => {
  return (
    username === process.env.SIGNAL_USERNAME &&
    password === process.env.SIGNAL_PASSWORD
  );
};
