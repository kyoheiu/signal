// Second step: TOTP authentication

import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useAtom } from "jotai";
import { verifiedDnAtom } from "../state/jotai";
import { loadSecret } from "../server/totp";
import * as base64 from "js-base64";
import * as qrcode from "qrcode.react";
import { TotpForm } from "../component/TotpForm";
import { Title } from "../component/Title";
import { EnterTotp } from "../component/EnterTotp";
import { useEffect } from "react";
import { ReadCode } from "../component/ReadCode";

export const meta: MetaFunction = () => {
  return [{ title: "signal" }];
};

interface Data {
  uri: string;
  param: string;
}

export const loader: LoaderFunction = async ({ params }) => {
  const dnParam = base64.decode(params.dn as string);
  const res = await loadSecret(dnParam as string);
  if (!res.ok) {
    return null;
  }
  const j = await res.json();
  return { ...j, param: dnParam };
};

export default function Otp() {
  const navigate = useNavigate();
  const data: Data = useLoaderData();
  const [verifiedDn] = useAtom(verifiedDnAtom);

  useEffect(() => {
    if (!verifiedDn || data.param !== verifiedDn) {
      navigate("/login");
    }
  });

  return (
    <>
      <div className="flex flex-col items-center">
        <Title />
        {data.uri ? (
          <>
            <qrcode.QRCodeSVG className="mb-6" value={data.uri} />
            <ReadCode />
          </>
        ) : (
          <EnterTotp />
        )}
        <TotpForm dn={verifiedDn} />
      </div>
    </>
  );
}
