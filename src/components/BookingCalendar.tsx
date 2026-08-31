import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { availabilityAPI } from "@/lib/api";

interface BookingCalendarProps {
  propertyId: string;
  onDatesSelected: (startDate: string, endDate: string) => void;
}

export default function BookingCalendar({ propertyId, onDatesSelected }: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, propertyId]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const data = await availabilityAPI.getCalendarData(
        propertyId,
        currentDate.getMonth(),
        currentDate.getFullYear()
      );
      setCalendarData(data.calendar);
      setBlockedDates(data.blockedDates);
    } catch (err) {
      console.error("Error loading calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDateClick = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split("T")[0];

    if (!selectedStartDate) {
      setSelectedStartDate(dateStr);
      setSelectedEndDate(null);
    } else if (!selectedEndDate) {
      if (dateStr >= selectedStartDate) {
        setSelectedEndDate(dateStr);
        onDatesSelected(selectedStartDate, dateStr);
      } else {
        setSelectedStartDate(dateStr);
        setSelectedEndDate(null);
      }
    } else {
      setSelectedStartDate(dateStr);
      setSelectedEndDate(null);
    }
  };

  const isDateSelected = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split("T")[0];

    if (!selectedStartDate || !selectedEndDate) return dateStr === selectedStartDate;

    return dateStr >= selectedStartDate && dateStr <= selectedEndDate;
  };

  const isDateBlocked = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split("T")[0];

    return !(calendarData?.[dateStr]?.available ?? true);
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading calendar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Booking Dates</CardTitle>
        <CardDescription>Choose your check-in and check-out dates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Month Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={prevMonth}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <h3 className="font-semibold text-lg">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1">
            {dayLabels.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isBlocked = isDateBlocked(day);
              const isSelected = isDateSelected(day);
              const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                .toISOString()
                .split("T")[0];
              const isStart = dateStr === selectedStartDate;
              const isEnd = dateStr === selectedEndDate;

              return (
                <button
                  key={day}
                  onClick={() => !isBlocked && handleDateClick(day)}
                  disabled={isBlocked || dateStr < new Date().toISOString().split("T")[0]}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    isBlocked
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : isSelected
                      ? "bg-primary text-primary-foreground"
                      : isStart || isEnd
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Dates Display */}
        {selectedStartDate && (
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm text-muted-foreground">Selected Dates:</p>
            <div className="flex gap-2">
              <Badge variant="outline">
                Check-in: {new Date(selectedStartDate).toLocaleDateString()}
              </Badge>
              {selectedEndDate && (
                <Badge variant="outline">
                  Check-out: {new Date(selectedEndDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
            {selectedStartDate && selectedEndDate && (
              <p className="text-sm font-medium">
                Duration: {Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 60 * 60 * 24))} nights
              </p>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium">Legend:</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span className="text-sm">Available & Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100" />
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-sm">Blocked/Unavailable</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
