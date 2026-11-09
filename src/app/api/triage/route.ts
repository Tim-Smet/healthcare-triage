import { z } from "zod";
import { TriageInputSchema } from "@/lib/triage/schema";
import { runTriage } from "@/lib/triage/service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = TriageInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input.", fields: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  const record = await runTriage(parsed.data);
  return Response.json(record, { status: 201 });
}
