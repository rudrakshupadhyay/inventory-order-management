export interface RegisterRequestBody {
  name: string;
  username: string;
  password: string;
}

export interface LoginRequestBody {
  username: string;
  password: string;
}
