import { useState, useCallback, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, EVENTS, Step } from "react-joyride";
import { trpc } from "@/lib/trpc";
import { getTourById } from "@/lib/tourConfigs";

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
    if (autoStart && steps.length > 0 && progress?.status !== "completed") {
      setStepIndex(progress?.lastStep || 0);
      setRun(true);
    }
  }, [autoStart, steps, progress]);

  const handleJoyrideCallback = useCallback(
    async (data: CallBackProps) => {
      const { status, type, index, action } = data;

      if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
        const nextStepIndex = index + (action === "prev" ? -1 : 1);
        
        if (nextStepIndex >= 0 && nextStepIndex < steps.length) {
          setStepIndex(nextStepIndex);

          await updateProgress.mutateAsync({
            tourId: tourDbId,
            lastStep: nextStepIndex,
            status: "in_progress",
          });
        }
      } else if ([STATUS.FINISHED].includes(status as any)) {
        await completeTour.mutateAsync({
          tourId: tourDbId,
        });
        setRun(false);
        setStepIndex(0);
      } else if ([STATUS.SKIPPED].includes(status as any)) {
        await dismissTour.mutateAsync({
          tourId: tourDbId,
        });
        setRun(false);
        setStepIndex(0);
      }
    },
    [tourDbId, updateProgress, completeTour, dismissTour]
  );

  const startTour = useCallback(() => {
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
          textColor: "#333",
          backgroundColor: "#fff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          arrowColor: "#fff",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "12px",
          padding: "20px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "#2DB5A8",
          borderRadius: "8px",
          padding: "10px 20px",
        },
        buttonBack: {
          color: "#2DB5A8",
          marginRight: "10px",
        },
        buttonSkip: {
          color: "#999",
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
