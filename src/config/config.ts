import dotenv from "dotenv";
dotenv.config();

interface Configtype {
  port: number;
  jwtSecret: string;
}

if (!process.env.PORT) {
  throw new Error("PORT is not defined in the environment variables");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

const config: Configtype = {
  port: parseInt(process.env.PORT, 10),
  jwtSecret: process.env.JWT_SECRET,
};

export default config;
