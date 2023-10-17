// First authentication: LDAP

import { type LoaderFunction, type MetaFunction, json } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { verifiedDnAtom, refAtom, warningCredAtom } from "../state/jotai";
import { useAtom } from "jotai";
import { Title } from "../component/Title";
import { SubmitButton } from "../component/SubmitButton";
import { useState } from "react";
import { Warning } from "~/component/Warning";

interface Data {
  ref: string | null;
}

export const meta: MetaFunction = () => {
  return [{ title: "signal" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  console.log("Loading /login ...");
  const url = new URL(request.url);
  const ref: string | null = url.searchParams.get("ref");
  return json({ ref: ref });
};

export default function LogIn() {
  const data: Data = useLoaderData();
  const [, setRef] = useAtom(refAtom);
  if (data.ref) {
    setRef(() => data.ref as string);
    console.log(`ref set: ${data.ref}`);
  }
  const navigate = useNavigate();
  const [dn, setDn] = useState("");
  const [, setVerifiedDn] = useAtom(verifiedDnAtom);
  const [password, setPassword] = useState("");
  const [warningCred, setWarningCred] = useAtom(warningCredAtom);

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
      setWarningCred(() => "");
      setVerifiedDn(() => dn);
      const j = await res.json();
      navigate(j.to);
    } else {
      const result = await res.text();
      setWarningCred(() => result);
    }
  };

  return (
    <div>
      <Title />
      <Warning warning={warningCred} />
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
        <SubmitButton />
      </Form>
    </div>
  );
}
