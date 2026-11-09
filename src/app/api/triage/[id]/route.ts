import { z } from "zod";
import { getTriage } from "@/lib/triage/service";

export async function GET(_request: Request, ctx: RouteContext<"/api/triage/[id]">) {
  const { id } = await ctx.params;

  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "Invalid id." }, { status: 400 });
  }

  const record = await getTriage(id);
  if (!record) {
    return Response.json({ error: "Triage not found." }, { status: 404 });
  }

  return Response.json(record);
}
