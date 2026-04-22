"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { MailCheck } from "lucide-react";
import { WaitlistCard } from "@/components/ui/card-6";
import { Button } from "@/components/ui/button";

export default function WaitlistCardDemo() {
  const [isVisible, setIsVisible] = React.useState(true);

  return (
    <div className="flex w-full flex-col items-center justify-center bg-background p-4" style={{ minHeight: "450px" }}>
      <div className="absolute top-5">
        <Button onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? "Hide" : "Show"} Card
        </Button>
      </div>

      <AnimatePresence>
        {isVisible && (
          <WaitlistCard
            icon={<MailCheck className="h-8 w-8" />}
            title="You're on the waitlist!"
            description="Thanks for registering! We've received your information and will notify you via email as soon as a spot becomes available."
            footerContent={
              <p className="text-sm text-muted-foreground">
                Questions?{" "}
                <a
                  href="#"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Contact Support
                </a>
              </p>
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
