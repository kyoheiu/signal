import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useAtom } from "jotai";
import { dnAtom, verifiedAtom } from "./jotai";
import { loadSecret } from "./totp";
import * as base64 from "js-base64";
import * as qrcode from "qrcode.react";
import { TotpForm } from "./TotpForm";
import { Title } from "./Title";
import { EnterTotp } from "./EnterTotp";
import type { Hash } from "~/type";
import { useEffect } from "react";
import { ReadCode } from "./ReadCode";

export const meta: MetaFunction = () => {
  return [{ title: "signal" }];
};

interface Data {
  secret: Hash;
  firstTime: boolean;
  uri: string;
}

export const loader: LoaderFunction = async ({ params }) => {
  const dn = base64.decode(params.dn as string);
  const res = await loadSecret(dn as string);
  if (!res.ok) {
    return null;
  }
  const j = await res.json();
  return j;
};

export default function Otp() {
  const navigate = useNavigate();
  const data: Data = useLoaderData();
  const [dn] = useAtom(dnAtom);
  const [verified] = useAtom(verifiedAtom);

  useEffect(() => {
    if (!verified) {
      navigate("login");
    }
  });

  if (!verified) {
    return;
  } else {
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
          <TotpForm dn={dn} />
        </div>
      </>
    );
  }
}
