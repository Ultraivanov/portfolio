import keystaticConfig from "../../../../../keystatic.config";
import { makeRouteHandler } from "@keystatic/next/route-handler";
import { isKeystaticProductionWithoutGitHub } from "@/lib/keystatic";

let keystaticRouteHandler:
  | ReturnType<typeof makeRouteHandler>
  | undefined;

const getKeystaticRouteHandler = () => {
  if (!keystaticRouteHandler) {
    keystaticRouteHandler = makeRouteHandler({
      config: keystaticConfig,
      localBaseDirectory: process.cwd(),
    });
  }

  return keystaticRouteHandler;
};

const notConfiguredResponse = () =>
  new Response(
    "Keystatic is running in local storage mode without GitHub credentials. Configure GitHub mode before using the deployed CMS.",
    { status: 503 },
  );

export async function GET(request: Request) {
  if (isKeystaticProductionWithoutGitHub) {
    return notConfiguredResponse();
  }

  return getKeystaticRouteHandler().GET(request);
}

export async function POST(request: Request) {
  if (isKeystaticProductionWithoutGitHub) {
    return notConfiguredResponse();
  }

  return getKeystaticRouteHandler().POST(request);
}

export const runtime = "nodejs";
