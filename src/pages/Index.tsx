import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { InsideRebuild } from "@/components/InsideRebuild";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserCog, LogOut } from "lucide-react";
import { PROFILE_UPDATED_EVENT } from "@/utils/insideProfileData";
import { useToast } from "@/hooks/use-toast";
import {
  clearDemoMode,
  expireDemoModeIfNeeded,
  getDemoLogs,
  getDemoModeState,
  getDemoUploadsRemaining,
  logDemoEvent,
} from "@/utils/demoMode";

interface UserProfile {
  name: string;
  email: string;
  photoUrl: string;
  faceVerified: boolean;
  demoMode?: boolean;
}

const emptyProfile: UserProfile = {
  name: "User",
  email: "",
  photoUrl: "",
  faceVerified: false,
  demoMode: false,
};

const normalizeTab = (tab: string) => {
  if (tab === "profile" || tab === "settings") return "resources";
  if (tab === "education" || tab === "learn") return "resources";
  return tab;
};

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const initialTab = normalizeTab(searchParams.get("tab") || "dashboard");
  const [activeTab, setActiveTab] = useState(initialTab);
  const [demoNow, setDemoNow] = useState(Date.now());
  const demoExpiryHandledRef = useRef(false);
  const { toast } = useToast();

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem("userProfile");
      if (!savedProfile) return emptyProfile;
      const parsed = JSON.parse(savedProfile) as Partial<UserProfile> & { demoMode?: boolean };
      return {
        ...emptyProfile,
        ...parsed,
        name: parsed.name?.trim() || "User",
        demoMode: Boolean(parsed.demoMode),
      };
    } catch {
      return emptyProfile;
    }
  });

  useEffect(() => {
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    const refreshProfile = () => {
      try {
        const raw = localStorage.getItem("userProfile");
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<UserProfile> & { demoMode?: boolean };
        setUserProfile((current) => ({
          ...current,
          ...parsed,
          name: parsed.name?.trim() || current.name || "User",
          demoMode: Boolean(parsed.demoMode),
        }));
      } catch {
        // Ignore invalid local profile payloads
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, refreshProfile);
  }, []);

  useEffect(() => {
    const tab = normalizeTab(searchParams.get("tab") || "dashboard");
    if (userProfile.demoMode && tab === "resources") {
      setActiveTab("dashboard");
      setSearchParams({ tab: "dashboard" });
      return;
    }
    setActiveTab(tab);
  }, [searchParams, setSearchParams, userProfile.demoMode]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!userProfile.demoMode) return;
    demoExpiryHandledRef.current = false;

    const tick = () => {
      const active = expireDemoModeIfNeeded();
      setDemoNow(Date.now());
      if (!active && !demoExpiryHandledRef.current) {
        demoExpiryHandledRef.current = true;
        logDemoEvent("demo_redirect", "Redirected to welcome after demo session expiry.");
        localStorage.removeItem("userProfile");
        setUserProfile(emptyProfile);
        toast({
          title: "Demo session ended",
          description: "6-minute demo completed. Start Demo Mode again from welcome page.",
        });
        navigate("/", { replace: true });
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [navigate, toast, userProfile.demoMode]);

  const handleTabChange = (tab: string) => {
    const normalized = normalizeTab(tab);
    if (userProfile.demoMode && normalized === "resources") {
      logDemoEvent("section_blocked", "Resources/Profile/Settings blocked in demo mode.");
      toast({
        title: "Demo Mode restriction",
        description: "Profile and Settings are locked in Demo Mode.",
      });
      return;
    }
    setActiveTab(normalized);
    setSearchParams({ tab: normalized });
  };

  const handleLogout = () => {
    if (userProfile.demoMode) {
      clearDemoMode("manual");
    }
    localStorage.removeItem("userProfile");
    setUserProfile(emptyProfile);
    navigate("/");
  };

  const demoState = userProfile.demoMode ? getDemoModeState() : null;
  const demoActive = Boolean(demoState?.active && (demoState?.expiresAt || 0) > demoNow);
  const demoRemainingMs = demoActive ? Math.max(0, (demoState?.expiresAt || 0) - demoNow) : 0;
  const demoUploadsRemaining = demoActive ? getDemoUploadsRemaining() : 0;
  const demoLogs = userProfile.demoMode ? getDemoLogs(3) : [];
  const demoMinutes = Math.floor(demoRemainingMs / 60000);
  const demoSeconds = Math.floor((demoRemainingMs % 60000) / 1000);
  const demoRemainingLabel = `${demoMinutes}:${String(demoSeconds).padStart(2, "0")}`;

  const formatLogTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard";
      case "documents":
        return "Document Analysis";
      case "misinformation":
        return "Fact Check";
      case "chat":
        return "AI Assistant";
      case "infantry":
        return "Infantry";
      case "resources":
        return "Resource Center";
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b p-4 h-16 flex-shrink-0">
          <h1 className="text-xl font-bold tracking-tight">{getPageTitle()}</h1>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-auto px-3 space-x-3">
                  <span className="text-right">
                    <div className="font-medium">Hi, {userProfile.name}</div>
                  </span>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={userProfile.photoUrl} alt="User avatar" />
                    <AvatarFallback>{userProfile.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userProfile.email || "No email set"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => handleTabChange("resources")}
                  disabled={userProfile.demoMode && demoActive}
                >
                  <UserCog className="mr-2 h-4 w-4" />
                  <span>{userProfile.demoMode && demoActive ? "Resources (Locked in Demo)" : "Resources"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
          {userProfile.demoMode ? (
            <div className="mb-4 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold">Demo Mode Active</div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Time Left {demoRemainingLabel}</Badge>
                  <Badge variant="outline">Uploads Left {Math.max(0, demoUploadsRemaining)}</Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                This preview session is limited to 6 minutes and one total file upload. Profile and Settings are blocked.
              </div>
              <div className="space-y-1">
                {demoLogs.map((entry) => (
                  <div key={entry.id} className="text-xs text-muted-foreground">
                    [{formatLogTime(entry.at)}] {entry.message}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <InsideRebuild activeTab={activeTab} />
        </main>
      </div>
    </div>
  );
};

export default Index;
