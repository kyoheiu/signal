import { ActionFunction } from "@remix-run/node";
import jwt from "jsonwebtoken";

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const username = (form.get("username") as string) ?? "";
  const password = (form.get("password") as string) ?? "";

  if (validateCredentials(username, password)) {
    return new Response(null, {
      status: 200,
    });
  } else {
    return new Response("Invalid credentials.", {
      status: 400,
    });
  }
};

export const validateCredentials = (username: string, password: string) => {
  if (
    username === process.env.SIGNAL_USERNAME &&
    password === process.env.SIGNAL_PASSWORD
  ) {
    console.log("Credentials verified.");
    return true;
  } else {
    console.log("Invalid credentials.");
    return false;
  }
};
