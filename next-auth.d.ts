import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      first_auth: boolean;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    first_auth?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    first_auth?: boolean;
  }
}
