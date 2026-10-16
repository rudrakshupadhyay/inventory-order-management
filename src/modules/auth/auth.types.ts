import type { JwtPayload } from "jsonwebtoken";

export interface RegisterRequestBody {
  name: string;
  username: string;
  password: string;
}

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface AccessTokenPayload extends JwtPayload {
  id: number;
  sessionId: number;
}
