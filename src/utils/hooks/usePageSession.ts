import { type Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type UsePageSessionArgs = {
  serverSession: Session | null;
}


export const usePageSession = ({ serverSession} : UsePageSessionArgs) => {
  const clientSession = useSession();
  const [pageSession, setPageSession] = useState<Session | null>(serverSession);

  useEffect(() => {
    if (clientSession.status === 'loading') {
      return;
    }
    setPageSession(clientSession.data);
  }, [clientSession]);

  return [pageSession];
}
