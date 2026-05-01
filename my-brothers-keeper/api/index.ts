import "dotenv/config";
import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/_core/app";

const appPromise = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
