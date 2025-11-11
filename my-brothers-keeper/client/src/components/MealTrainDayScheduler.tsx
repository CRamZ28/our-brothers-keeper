import { useState, useMemo } from "react";
import { format, addDays, isSameDay, isWeekend, startOfDay, isBefore } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

interface MealTrainDaySchedulerProps {
  selectedDates: Date[];
  onChange: (dates: Date[]) => void;
  daysAheadOpen: number;
  onDaysAheadChange: (days: number) => void;
  startDate?: Date;
}

export function MealTrainDayScheduler({
  selectedDates,
  onChange,
  daysAheadOpen,
  onDaysAheadChange,
  startDate = new Date(),
}: MealTrainDaySchedulerProps) {
  const today = startOfDay(new Date());
  const effectiveStartDate = startOfDay(startDate);

  const daysToShow = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 60; i++) {
      days.push(addDays(effectiveStartDate, i));
    }
    return days;
  }, [effectiveStartDate]);

  const daysByWeek = useMemo(() => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    const firstDay = daysToShow[0];
    const dayOfWeek = firstDay.getDay();
    
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push(addDays(firstDay, -(dayOfWeek - i)));
    }
    
    daysToShow.forEach((day, index) => {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(addDays(currentWeek[currentWeek.length - 1], 1));
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  }, [daysToShow]);

  const isDateSelected = (date: Date) => {
    return selectedDates.some(selectedDate => isSameDay(selectedDate, date));
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || !daysToShow.some(d => isSameDay(d, date));
  };

  const toggleDate = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (isDateSelected(date)) {
      onChange(selectedDates.filter(d => !isSameDay(d, date)));
    } else {
      onChange([...selectedDates, date]);
    }
  };

  const handleSelectAll = () => {
    const validDays = daysToShow.filter(day => !isBefore(day, today));
    onChange(validDays);
  };

  const handleWeekdaysOnly = () => {
    const validWeekdays = daysToShow.filter(day => !isBefore(day, today) && !isWeekend(day));
    onChange(validWeekdays);
  };

  const handleWeekendsOnly = () => {
    const validWeekends = daysToShow.filter(day => !isBefore(day, today) && isWeekend(day));
    onChange(validWeekends);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleDaysAheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= 365) {
      onDaysAheadChange(value);
    }
  };

  return (
    <Card className="card-elevated-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Select Available Days
            </CardTitle>
            <CardDescription className="mt-2">
              Choose which days you're available to receive meals
            </CardDescription>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-primary">{selectedDates.length}</span>
            <span className="text-muted-foreground"> day{selectedDates.length !== 1 ? 's' : ''} selected</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="hover:bg-primary/10"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWeekdaysOnly}
              className="hover:bg-primary/10"
            >
              Weekdays Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWeekendsOnly}
              className="hover:bg-primary/10"
            >
              Weekends Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              Clear All
            </Button>
          </div>

          <div className="flex items-center gap-3 max-w-xs">
            <Label htmlFor="days-ahead" className="whitespace-nowrap">
              Days Ahead Open:
            </Label>
            <Input
              id="days-ahead"
              type="number"
              min="1"
              max="365"
              value={daysAheadOpen}
              onChange={handleDaysAheadChange}
              className="w-24"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card/50 p-4 backdrop-blur-sm">
          <div className="grid grid-cols-7 gap-2 mb-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {daysByWeek.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, dayIndex) => {
                  const selected = isDateSelected(day);
                  const disabled = isDateDisabled(day);
                  const isPast = isBefore(day, today);
                  const isInRange = daysToShow.some(d => isSameDay(d, day));

                  return (
                    <button
                      key={`${weekIndex}-${dayIndex}`}
                      onClick={() => toggleDate(day)}
                      disabled={disabled}
                      className={cn(
                        "relative rounded-lg p-3 transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center gap-1",
                        "border focus:outline-none focus:ring-2 focus:ring-primary/50",
                        selected && !disabled && [
                          "bg-primary text-primary-foreground border-primary shadow-md",
                          "hover:bg-primary/90 hover:shadow-lg",
                        ],
                        !selected && !disabled && [
                          "bg-muted/50 border-border text-foreground",
                          "hover:bg-muted hover:border-primary/50 hover:shadow-sm hover-lift",
                        ],
                        disabled && !isInRange && [
                          "bg-transparent border-transparent text-transparent cursor-default opacity-0",
                        ],
                        disabled && isInRange && isPast && [
                          "bg-muted/20 border-border/30 text-muted-foreground/40 cursor-not-allowed opacity-50",
                        ]
                      )}
                    >
                      <span className={cn(
                        "text-base font-semibold",
                        selected && !disabled && "text-primary-foreground",
                        !selected && !disabled && "text-foreground",
                        disabled && isInRange && "text-muted-foreground/40"
                      )}>
                        {format(day, "d")}
                      </span>
                      <span className={cn(
                        "text-[10px] font-medium",
                        selected && !disabled && "text-primary-foreground/80",
                        !selected && !disabled && "text-muted-foreground",
                        disabled && isInRange && "text-muted-foreground/30"
                      )}>
                        {format(day, "MMM")}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary border border-primary" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/50 border border-border" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/20 border border-border/30 opacity-50" />
            <span>Past Date</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
