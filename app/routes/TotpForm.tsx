import { Form, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { SubmitButton } from "./SubmitButton";

export const TotpForm = ({ hash }: { hash: Hash }) => {
  const navigate = useNavigate();
  const [num, setNum] = useState("");

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/totp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ num: num, hash: hash }),
    });
    if (res.ok) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <Form
      method="post"
      onSubmit={submitForm}
      className="flex flex-col items-center mb-6"
    >
      <input
        className="rounded w-56 mb-3 bg-neutral-600 p-2"
        type="text"
        name="num"
        value={num}
        onChange={(e) => setNum(() => e.target.value)}
        autoComplete="off"
      />
      <SubmitButton />
    </Form>
  );
};
