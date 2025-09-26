"use client";

import { useState } from "react";
import { defineStepper } from "@stepperize/react";
import { Button } from "@/components/ui/button";

const { Scoped, useStepper, steps } = defineStepper(
  { id: "personal", title: "Personal details", description: "Your basic information" },
  { id: "documents", title: "Documents", description: "Upload proof documents" },
  { id: "review", title: "Review & Submit", description: "Confirm and submit" }
);

export function KYCWizard() {
  return (
    <Scoped>
      <StepperUI />
    </Scoped>
  );
}

function StepperUI() {
  const ctx = useStepper() as any;
  if (!ctx || !ctx.currentStep) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Initializing wizard…
      </div>
    );
  }
  const { currentStep, currentIndex, nextStep, prevStep, isFirst, isLast } = ctx;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch("/api/investor/kyc/complete", { method: "POST" });
      if (!res.ok) throw new Error("Failed to complete KYC");
      window.location.href = "/investor";
    } catch (e: any) {
      setError(e.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Step headers */}
      <ol className="flex items-center gap-3">
        {steps.map((s, i) => (
          <li key={s.id} className={`flex-1 rounded-full px-3 py-1 text-xs ${i === currentIndex ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {s.title}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-lg border p-6">
        {currentStep.id === "personal" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full name</label>
              <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" placeholder="Satoshi Nakamoto" />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input className="mt-1 w-full rounded-md border bg-background px-3 py-2" placeholder="Street, City, Country" />
            </div>
          </div>
        )}

        {currentStep.id === "documents" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Government ID (PDF/JPG)</label>
              <input type="file" className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Selfie</label>
              <input type="file" className="mt-1 w-full rounded-md border bg-background px-3 py-2" />
            </div>
          </div>
        )}

        {currentStep.id === "review" && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Review your information. By submitting you agree to verification and storage for compliance.</p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" onClick={prevStep} disabled={isFirst || submitting}>Back</Button>
          {!isLast ? (
            <Button onClick={nextStep} disabled={submitting}>Next</Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting..." : "Submit"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
