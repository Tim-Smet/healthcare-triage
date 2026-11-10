import { z } from "zod";
import { ScreenInputSchema } from "@/lib/triage/schema";
import { screenTriage } from "@/lib/triage/service";

/** Step 1: the free text only. Says "emergency" (with a record id) or which questions to ask. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = ScreenInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input.", fields: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  return Response.json(await screenTriage(parsed.data.text));
}
