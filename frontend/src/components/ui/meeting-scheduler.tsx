"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

interface MeetingSchedulerProps {
  title?: string;
  description?: string;
  value: string;
  onChange: (dateValue: string) => void;
  minDate?: string;
  className?: string;
}

const formatReadable = (dateValue: string) => {
  const parsed = parse(dateValue, "yyyy-MM-dd", new Date());
  return Number.isNaN(parsed.getTime()) ? dateValue : format(parsed, "EEE, MMM d, yyyy");
};

export const MeetingScheduler = ({
  title = "Select booking date",
  description = "Pick the date for your booking request.",
  value,
  onChange,
  minDate,
  className,
}: MeetingSchedulerProps) => {
  const initialDate = value ? parse(value, "yyyy-MM-dd", new Date()) : new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
  const minimumDate = minDate ? parse(minDate, "yyyy-MM-dd", new Date()) : startOfDay(new Date());

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
      }),
    [currentMonth]
  );

  const handleSelect = (day: Date) => {
    if (isBefore(day, minimumDate) && !isSameDay(day, minimumDate)) return;
    onChange(format(day, "yyyy-MM-dd"));
  };

  const prevMonth = () => setCurrentMonth((month) => addMonths(month, -1));
  const nextMonth = () => setCurrentMonth((month) => addMonths(month, 1));

  return (
    <Card className={cn("overflow-hidden border-slate-200 bg-white shadow-[0_16px_40px_rgba(2,33,71,0.08)]", className)}>
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-[#002147] via-[#0f3460] to-[#1f4e79] text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">{title}</CardTitle>
            <CardDescription className="text-slate-200">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month" className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <AnimatePresence mode="wait">
              <motion.h3
                key={format(currentMonth, "MMMM yyyy")}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="text-lg font-semibold text-slate-900"
              >
                {format(currentMonth, "MMMM yyyy")}
              </motion.h3>
            </AnimatePresence>

            <Button type="button" variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month" className="rounded-full">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isPastDay = isBefore(day, minimumDate) && !isSameDay(day, minimumDate);
              const isToday = isSameDay(day, new Date());

              return (
                <motion.button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  whileHover={isPastDay ? undefined : { scale: 1.04 }}
                  whileTap={isPastDay ? undefined : { scale: 0.96 }}
                  disabled={isPastDay}
                  className={cn(
                    "relative flex h-10 w-full items-center justify-center rounded-full text-sm font-medium transition",
                    !isSameMonth(day, currentMonth) && "text-slate-300",
                    isToday && !isSelected && "text-[#002147] ring-1 ring-[#002147]/20",
                    isPastDay && "cursor-not-allowed text-slate-300 line-through",
                    isSelected && "bg-[#002147] text-white shadow-lg shadow-[#002147]/20",
                    !isSelected && !isPastDay && "hover:bg-slate-100"
                  )}
                >
                  {format(day, "d")}
                  {isSelected && (
                    <span className="absolute inset-x-3 bottom-1 h-1 rounded-full bg-white/70" />
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Selected date</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{selectedDate ? formatReadable(value) : "Choose a day"}</p>
            <p className="mt-1 text-sm text-slate-500">The calendar blocks dates before today.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
