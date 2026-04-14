import keystaticConfig from "../../../../../keystatic.config";
import { makeRouteHandler } from "@keystatic/next/route-handler";

export const { GET, POST } = makeRouteHandler({
  config: keystaticConfig,
  localBaseDirectory: process.cwd(),
});

export const runtime = "nodejs";
