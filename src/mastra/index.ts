import { Mastra } from "@mastra/core";
import { triageAgent } from "../lib/mastra/agent";

/** Entry point for `npm run studio` (Mastra Studio). Dev tool only, not used by the app. */
export const mastra = new Mastra({
  agents: { triageAgent },
});
