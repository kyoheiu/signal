import { createCookieSessionStorage } from "@remix-run/node";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "signal_session",
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
      secrets: ["test"],
    },
  });

export { getSession, commitSession, destroySession };
