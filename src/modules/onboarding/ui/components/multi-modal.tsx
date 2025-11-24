"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MultiStepModal, MultiStepModalContent } from "@/components/ui/multi-step-modal";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import confettiLib from "canvas-confetti";

/* CONFETTI ABOVE EVERYTHING */
function runConfetti() {
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "200000";

  document.body.appendChild(canvas);

  const c = confettiLib.create(canvas, { resize: true });

  c({
    particleCount: 105,          // ↓ fewer particles
    spread: 800,                 // ↓ smaller burst
    startVelocity: 35,          // ↓ lower speed
    scalar: 1,                // 🔥 key change → half-size confetti
    origin: { y: 0.6 },
  });

  setTimeout(() => canvas.remove(), 1200);
}

export default function OnboardingModal() {
  const isMobile = useIsMobile();
  const { data: session } = authClient.useSession();

  const [referrer, setReferrer] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const [shareOpen, setShareOpen] = useState(false); // MOBILE ONLY

  const handleCreateTribe = async () => {
    try {
      if (!session?.user?.id) {
        toast.error('Please log in first');
        return;
      }

      const response = await fetch('/api/tribe/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedCode(data.code);
        
        if (isMobile) {
          setShareOpen(true);
        }
      } else {
        toast.error('Failed to create tribe');
      }
    } catch (error) {
      console.error('Error creating tribe:', error);
      toast.error('An error occurred while creating tribe');
    }
  };

  const handleJoinTribe = async () => {
    if (code.length !== 6) return;

    setJoining(true);

    try {
      if (!session?.user?.id) {
        toast.error('Please log in first');
        setJoining(false);
        return;
      }

      const response = await fetch('/api/tribe/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id, code }),
      });

      if (response.ok) {
        setJoining(false);
        setJoined(true);
        runConfetti();
        setTimeout(() => (window.location.href = "/predict"), 900);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to join tribe');
        setJoining(false);
      }
    } catch (error) {
      console.error('Error joining tribe:', error);
      toast.error('An error occurred while joining tribe');
      setJoining(false);
    }
  };

  const handleFinish = async () => {
    try {
      if (!session?.user?.id) {
        toast.error('Please log in first');
        return;
      }

      // Mark user as onboarded
      const response = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: session.user.id }),
      });

      if (response.ok) {
        runConfetti();
        setTimeout(() => (window.location.href = "/predict"), 900);
      } else {
        toast.error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('An error occurred during onboarding');
    }
  };

  const steps = [
    {
      title: "Welcome to TickerTribe",
      progress: "Step 1 of 3",
      description: "Let's get your account ready!",
      content: (
        <p className="text-sm text-muted-foreground">
          This will take less than 30 seconds.
        </p>
      ),
    },

    {
      title: "Where did you hear about us?",
      progress: "Step 2 of 3",
      description: "Choose one or more options.",
      content: (
        <div className="flex flex-col gap-3">
          {["Twitter", "Instagram", "Google Search", "Friend", "College", "Other"].map(
            (item) => (
              <label key={item} className="text-sm flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={referrer.includes(item)}
                  onChange={() =>
                    setReferrer((prev) =>
                      prev.includes(item)
                        ? prev.filter((x) => x !== item)
                        : [...prev, item]
                    )
                  }
                />
                <span>{item}</span>
              </label>
            )
          )}
        </div>
      ),
    },

    {
      title: createdCode ? "Your Tribe is Ready" : "Join or Create Tribe",
      progress: "Step 3 of 3",
      description: createdCode
        ? "Share this code with friends!"
        : "Join with a 6-character code or create your own tribe.",
      content: (
        <div className="flex flex-col gap-4">
          {/* JOIN TRIBE */}
          {!createdCode && (
            <>
              <input
                className="border rounded-md p-2 text-sm"
                maxLength={6}
                placeholder="Enter 6-character code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^a-fA-F0-9]/g, "").toLowerCase())}
              />

              <Button
                className="w-full"
                disabled={joining || code.length !== 6}
                onClick={handleJoinTribe}
              >
                {joining ? (
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    Joining...
                  </div>
                ) : joined ? (
                  "Joined!"
                ) : (
                  "Join Tribe"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">OR</div>

              <Button className="w-full" onClick={handleCreateTribe}>
                Create New Tribe
              </Button>
            </>
          )}

          {/* CREATED NEW TRIBE */}
          {createdCode && (
            <>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Your Tribe Code</p>
                <p className="text-3xl font-bold">{createdCode}</p>

                {/* DESKTOP ONLY — show sharing inline */}
                {!isMobile && (
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <Button variant="outline">WhatsApp</Button>
                    <Button variant="outline">Twitter</Button>
                    <Button variant="outline">Instagram</Button>
                  </div>
                )}
              </div>

              {/* MOBILE ONLY — open drawer */}
              {isMobile && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setShareOpen(true)}
                >
                  Share
                </Button>
              )}

              <Button className="w-full mt-4" onClick={handleFinish}>
                Continue
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <MultiStepModal defaultOpen>
        <MultiStepModalContent steps={steps} />
      </MultiStepModal>

      {/* MOBILE SHARE DRAWER */}
      {isMobile && (
        <ResponsiveDialog
          title="Share Your Tribe"
          description="Invite your friends!"
          open={shareOpen}
          onOpenChange={setShareOpen}
        >
          <div className="space-y-4">
            <p>Your Tribe Code</p>

            <div className="flex items-center gap-2">
              <input
                value={createdCode || ""}
                readOnly
                className="border rounded-md p-2 text-sm w-full"
              />

              <Button
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(createdCode || "")
                }
              >
                Copy
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline">WhatsApp</Button>
              <Button variant="outline">Twitter</Button>
              <Button variant="outline">Instagram</Button>
            </div>
          </div>
        </ResponsiveDialog>
      )}
    </>
  );
}
