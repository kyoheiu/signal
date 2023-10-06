import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { destroySession, getSession } from "../server/sessions";
import { verifyTOTPSession } from "../server/totp";
import { Title } from "../component/Title";

export const meta: MetaFunction = () => {
  return [{ title: "signal" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  console.log("Loading index...");
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");
  const session = await getSession(request.headers.get("Cookie"));
  const token = session.get("signal_session");
  if (verifyTOTPSession(token)) {
    return null;
  } else {
    return redirect(ref ? `/login?ref=${ref}` : "/login");
  }
};

export let action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);
  const ref = url.searchParams.get("ref");
  const session = await getSession(request.headers.get("Cookie"));
  return redirect(ref ? `/login?ref=${ref}` : "/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
};

export default function Index() {
  return (
    <>
      <div className="flex flex-col items-center">
        <Title />
        <div className="text-center text-xl italic font-extrabold mb-4">
          Welcome!
        </div>
        <Form method="post">
          <button
            type="submit"
            className="rounded-full bg-neutral-600 px-4 py-1"
          >
            Log out
          </button>
        </Form>
      </div>
    </>
  );
}
