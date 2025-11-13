import { useState, useCallback, useEffect, useRef } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, Step } from "react-joyride";
import { trpc } from "@/lib/trpc";
import { getTourById } from "@/lib/tourConfigs";
import { useQueryClient } from "@tanstack/react-query";

export interface UseTourOptions {
  tourDbId: number;
  tourSlug: string;
  autoStart?: boolean;
  continuous?: boolean;
}

export function useTour({ tourDbId, tourSlug, autoStart = false, continuous = true }: UseTourOptions) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const queryClient = useQueryClient();
  const hasManuallyClosedRef = useRef(false);

  const { data: progress } = trpc.onboarding.getProgress.useQuery(
    { tourId: tourDbId },
    { enabled: !!tourDbId }
  );

  const updateProgress = trpc.onboarding.updateProgress.useMutation();
  const completeTour = trpc.onboarding.completeTour.useMutation();
  const dismissTour = trpc.onboarding.dismissTour.useMutation();

  useEffect(() => {
    const tourConfig = getTourById(tourSlug);
    if (tourConfig) {
      setSteps(tourConfig.steps);
    }
  }, [tourSlug]);

  useEffect(() => {
    if (autoStart && steps.length > 0 && progress?.status !== "completed" && progress?.status !== "dismissed" && !hasManuallyClosedRef.current) {
      setStepIndex(progress?.lastStep || 0);
      setRun(true);
    }
  }, [autoStart, steps, progress]);

  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      const { status, type, index, action } = data;

      console.log("[TOUR DEBUG]", { status, type, index, action, stepsLength: steps.length });

      // Handle close button click
      if (action === "close") {
        console.log("[TOUR] Close button clicked");
        hasManuallyClosedRef.current = true;
        setRun(false);
        setStepIndex(0);
        
        await dismissTour.mutateAsync({
          tourId: tourDbId,
        });
        
        queryClient.invalidateQueries();
        return;
      }

      if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
        const nextStepIndex = index + (action === "prev" ? -1 : 1);
        
        // Check if user clicked "next" on the last step (finish button)
        if (action === "next" && index === steps.length - 1) {
          console.log("[TOUR] Last step completed - finishing tour");
          hasManuallyClosedRef.current = true;
          setRun(false);
          setStepIndex(0);
          
          await completeTour.mutateAsync({
            tourId: tourDbId,
          });
          
          queryClient.invalidateQueries();
          return;
        }
        
        if (nextStepIndex >= 0 && nextStepIndex < steps.length) {
          setStepIndex(nextStepIndex);

          await updateProgress.mutateAsync({
            tourId: tourDbId,
            lastStep: nextStepIndex,
            status: "in_progress",
          });
        }
      } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
        console.log("[TOUR] Finish or skip detected", status);
        hasManuallyClosedRef.current = true;
        setRun(false);
        setStepIndex(0);
        
        if (status === STATUS.FINISHED) {
          console.log("[TOUR] Completing tour");
          await completeTour.mutateAsync({
            tourId: tourDbId,
          });
        } else {
          console.log("[TOUR] Dismissing tour");
          await dismissTour.mutateAsync({
            tourId: tourDbId,
          });
        }
        
        queryClient.invalidateQueries();
      }
    },
    [tourDbId, steps.length, updateProgress, completeTour, dismissTour, queryClient]
  );

  const startTour = useCallback(() => {
    hasManuallyClosedRef.current = false;
    setStepIndex(progress?.lastStep || 0);
    setRun(true);
  }, [progress]);

  const stopTour = useCallback(() => {
    setRun(false);
  }, []);

  return {
    run,
    steps,
    stepIndex,
    startTour,
    stopTour,
    handleJoyrideCallback,
    progress,
    isCompleted: progress?.status === "completed",
    isDismissed: progress?.status === "dismissed",
  };
}

export interface TourProviderProps {
  tourDbId: number;
  tourSlug: string;
  autoStart?: boolean;
  continuous?: boolean;
  children?: React.ReactNode;
}

export function TourProvider({ tourDbId, tourSlug, autoStart = false, continuous = true }: TourProviderProps) {
  const { run, steps, stepIndex, handleJoyrideCallback } = useTour({
    tourDbId,
    tourSlug,
    autoStart,
    continuous,
  });

  if (steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous={continuous}
      showProgress
      showSkipButton
      disableOverlayClose
      spotlightPadding={4}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#2DB5A8",
          textColor: "#1f2937",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          overlayColor: "rgba(0, 0, 0, 0.3)",
          arrowColor: "rgba(255, 255, 255, 0.95)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "20px",
          padding: "28px 55px 28px 28px",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 248, 248, 0.93))",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 0 20px rgba(176, 140, 167, 0.6), 0 0 40px rgba(176, 140, 167, 0.4), 0 12px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          maxWidth: "720px",
          minWidth: "500px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipContent: {
          padding: "8px 0",
          fontSize: "15px",
          lineHeight: "1.6",
        },
        tooltipTitle: {
          fontSize: "18px",
          fontWeight: "600",
          marginBottom: "8px",
          color: "#B08CA7",
        },
        buttonNext: {
          backgroundColor: "#2DB5A8",
          borderRadius: "12px",
          padding: "12px 28px",
          fontSize: "15px",
          fontWeight: "600",
          boxShadow: "0 4px 12px rgba(45, 181, 168, 0.25)",
          transition: "all 0.2s ease",
        },
        buttonBack: {
          color: "#2DB5A8",
          marginRight: "12px",
          fontSize: "15px",
          fontWeight: "500",
          backgroundColor: "rgba(45, 181, 168, 0.1)",
          borderRadius: "10px",
          padding: "10px 20px",
          transition: "all 0.2s ease",
        },
        buttonSkip: {
          color: "#6b7280",
          fontSize: "14px",
          backgroundColor: "rgba(107, 114, 128, 0.1)",
          borderRadius: "8px",
          padding: "8px 16px",
          transition: "all 0.2s ease",
        },
        buttonClose: {
          color: "#6b7280",
          width: "32px",
          height: "32px",
          position: "absolute",
          top: "20px",
          right: "16px",
          padding: "4px",
          backgroundColor: "rgba(107, 114, 128, 0.05)",
          borderRadius: "8px",
          transition: "all 0.2s ease",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        open: "Open",
        skip: "Skip tour",
      }}
    />
  );
}
