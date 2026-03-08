import MatrixBackground from '../components/MatrixBackground';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, TimerReset, UploadCloud } from "lucide-react";
import { startDemoMode } from "@/utils/demoMode";

const WelcomePage = () => {
  const navigate = useNavigate();

  const launchDemoMode = () => {
    startDemoMode();
    localStorage.setItem(
      "userProfile",
      JSON.stringify({
        name: "Demo Analyst",
        email: "demo@trustlens.local",
        photoUrl: "",
        faceVerified: false,
        demoMode: true,
      })
    );
    navigate("/app?tab=dashboard");
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto font-space-grotesk">
      <MatrixBackground />
      <main className="relative z-20 flex min-h-[100dvh] w-full items-center justify-center px-3 pb-6 pt-16 sm:px-4 md:px-8 md:pt-20">
        <div className="hacker-panel relative z-10 mx-auto w-full max-w-xl rounded-xl border border-green-500/50 px-4 py-4 backdrop-blur-xl sm:px-5 sm:py-5 md:px-6 md:py-6">
          <h1 className="hacker-title mx-auto max-w-[500px] text-center text-[28px] font-extrabold leading-[1.08] tracking-tight text-green-400 text-shadow-neon md:text-[46px]">
            <span className="block">Uncover Truth</span>
            <span className="block">Navigate Justice</span>
          </h1>

          <p className="mx-auto mt-3 max-w-[500px] text-center text-xs leading-relaxed text-gray-200 md:text-sm">
            Welcome to TrustLens, your advanced AI co-pilot designed to cut through the noise of legal documents and combat misinformation.
            Analyze complex contracts, verify sources with unparalleled accuracy, and empower yourself with crystal-clear insights.
            We're here to ensure you navigate the legal landscape with absolute confidence and clarity.
          </p>

          <p className="mx-auto mt-3 max-w-[500px] text-center text-[14px] text-green-300 md:text-[20px]">
            "Empowering clarity in a world of information"
          </p>

          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="h-9 rounded-full bg-green-600 px-5 text-xs font-bold text-white shadow-lg shadow-green-500/50 transition-all duration-300 hover:scale-105 hover:bg-green-500"
            >
              Get Started
            </Button>
          </div>

          <section className="mt-5 rounded-lg border border-cyan-400/40 bg-cyan-500/5 p-4">
            <div className="text-sm font-semibold text-cyan-200">Demo Mode Preview</div>
            <p className="mt-1 text-xs leading-relaxed text-cyan-100/90">
              Demo Mode gives a guided hands-on overview of TrustLens workflows with controlled limits so users can quickly evaluate the platform behavior.
            </p>
            <div className="mt-2 rounded-md border border-cyan-300/30 bg-cyan-400/10 p-2 text-xs text-cyan-100/90">
              Explore a full preview of Dashboard signals, Document forensics intake, Fact-check pipeline, AI assistant behavior, and Infantry remediation flow with live demo activity logging.
            </div>
            <div className="mt-3 grid gap-2 text-xs text-cyan-100/90 sm:grid-cols-3">
              <div className="rounded-md border border-cyan-300/30 bg-cyan-400/10 p-2 flex items-center gap-2">
                <TimerReset className="h-3.5 w-3.5" />
                6-minute session
              </div>
              <div className="rounded-md border border-cyan-300/30 bg-cyan-400/10 p-2 flex items-center gap-2">
                <UploadCloud className="h-3.5 w-3.5" />
                1 file upload total
              </div>
              <div className="rounded-md border border-cyan-300/30 bg-cyan-400/10 p-2 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5" />
                Settings/Profile locked
              </div>
            </div>
            <div className="mt-3 flex justify-center">
              <Button
                size="sm"
                onClick={launchDemoMode}
                className="rounded-full bg-cyan-600 px-4 text-xs font-semibold text-white shadow-lg shadow-cyan-500/40 transition-all duration-300 hover:scale-105 hover:bg-cyan-500"
              >
                Launch Demo Mode
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
