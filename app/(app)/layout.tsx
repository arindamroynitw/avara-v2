import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/lib/contexts/user-context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (
    <UserProvider
      value={{
        id: user.id,
        fullName: userData?.full_name || "",
        email: userData?.email || user.email || "",
      }}
    >
      {children}
    </UserProvider>
  );
}
