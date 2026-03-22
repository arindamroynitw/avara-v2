import { createClient } from "@/lib/supabase/server";
import { getMFNav } from "@/lib/market-data/mf-nav";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schemeCode: string }> }
) {
  const { schemeCode } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nav = await getMFNav(schemeCode);
  if (nav === null) {
    return Response.json({ error: "NAV not found" }, { status: 404 });
  }

  return Response.json({ schemeCode, nav });
}
