import { LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useAtom } from "jotai";
import { verifiedAtom } from "./jotai";
import { loadSecret } from "./totp";
import * as base64 from "js-base64";
import * as qrcode from "qrcode.react";
import { TotpForm } from "./TotpForm";
import { Title } from "./Title";
import { EnterTotp } from "./EnterTotp";

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
  console.log(j);
  return j;
};

export default function otp() {
  const data: Data = useLoaderData();
  const [verified, setVerified] = useAtom(verifiedAtom);

  if (!verified) {
    return;
  } else if (data.firstTime) {
    return (
      <>
        <div className="flex flex-col items-center">
          <Title />
          <qrcode.QRCodeSVG value={data.uri} />
          Read this QR code by your favorite authenticator app.
          <EnterTotp />
          <TotpForm hash={data.secret} />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="flex flex-col items-center">
          <Title />
          <EnterTotp />
          <TotpForm hash={data.secret} />
        </div>
      </>
    );
  }
}
