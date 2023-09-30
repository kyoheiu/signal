import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { destroySession, getSession } from "~/sessions.server";

export const meta: MetaFunction = () => {
  return [{ title: "signal" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  if (session.has("token")) {
    return true;
  } else {
    console.log("Cannot detect session: Will be redirected to /login");
    return redirect("/login");
  }
};

export let action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};

export default function Index() {
  return (
    <>
      <div>Welcome!</div>
      <Form method="post">
        <button type="submit">Log out</button>
      </Form>
    </>
  );
}
