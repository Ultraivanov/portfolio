import keystaticConfig from "../../../../../keystatic.config";
import { makeRouteHandler } from "@keystatic/next/route-handler";
import { isKeystaticProductionWithoutGitHub } from "@/lib/keystatic";

const keystaticRouteHandler = makeRouteHandler({
  config: keystaticConfig,
  localBaseDirectory: process.cwd(),
});

const notConfiguredResponse = () =>
  new Response(
    "Keystatic is running in local storage mode without GitHub credentials. Configure GitHub mode before using the deployed CMS.",
    { status: 503 },
  );

export async function GET(request: Request) {
  if (isKeystaticProductionWithoutGitHub) {
    return notConfiguredResponse();
  }

  return keystaticRouteHandler.GET(request);
}

export async function POST(request: Request) {
  if (isKeystaticProductionWithoutGitHub) {
    return notConfiguredResponse();
  }

  return keystaticRouteHandler.POST(request);
}

export const runtime = "nodejs";
