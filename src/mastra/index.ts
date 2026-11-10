import { Mastra } from "@mastra/core";
import {
  Observability,
  MastraStorageExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { screeningAgent, triageAgent } from "../lib/mastra/agent";

/**
 * Entry point for `npm run studio` (Mastra Studio). Dev tool only, not used by
 * the app. Traces are kept in memory (lost on restart) and never leave this
 * machine: no platform exporter is configured.
 */
export const mastra = new Mastra({
  agents: { screeningAgent, triageAgent },
  observability: new Observability({
    configs: {
      default: {
        serviceName: "healthcare-triage",
        exporters: [new MastraStorageExporter()],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  }),
});
