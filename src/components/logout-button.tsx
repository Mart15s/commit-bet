"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { useI18n } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton({
  variant = "secondary",
  size = "md",
  className,
  showIcon = true,
}: {
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  showIcon?: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setIsLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(t("logout.error"));
      setIsLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <Button className={className} disabled={isLoading} onClick={handleLogout} size={size} type="button" variant={variant}>
        {showIcon && <LogOut size={16} />}
        {isLoading ? t("logout.loading") : t("logout.button")}
      </Button>
      {error && <p className="text-xs font-bold text-red-200">{error}</p>}
    </div>
  );
}
