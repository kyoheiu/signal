import { Form, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { SubmitButton } from "./SubmitButton";
import { refAtom, warningAtom } from "../state/jotai";
import { useAtom } from "jotai";

interface Props {
  dn: string | null;
}

export const TotpForm = (props: Props) => {
  const navigate = useNavigate();
  const [num, setNum] = useState("");
  const [ref] = useAtom(refAtom);
  const [, setWarning] = useAtom(warningAtom);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/totp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dn: props.dn, num: num, ref: ref }),
    });
    if (res.ok) {
      if (ref) {
        window.location.href = ref;
      } else {
        navigate("/");
      }
    } else {
      setWarning(() => "Invalid code.");
      navigate(ref ? `/login?ref=${ref}` : "/login");
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
