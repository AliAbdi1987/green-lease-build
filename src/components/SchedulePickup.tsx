import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00",
];

interface SchedulePickupProps {
  itemCount: number;
  location?: string;
}

const SchedulePickup = ({ itemCount, location }: SchedulePickupProps) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!date || !time) {
      toast.error("Please select both a date and time.");
      return;
    }
    setConfirmed(true);
    toast.success(
      `Pickup scheduled for ${format(date, "PPP")} at ${time}`,
    );
  };

  const handleReset = () => {
    setDate(undefined);
    setTime(undefined);
    setConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1 h-12 font-sans rounded-xl">
          <Truck className="w-4 h-4 mr-2" />
          Schedule Pickups
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Schedule Pickup</DialogTitle>
        </DialogHeader>

        {confirmed ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle2 className="w-12 h-12 text-metric-green" />
            <p className="text-lg font-sans font-semibold text-foreground text-center">
              Pickup confirmed!
            </p>
            <p className="text-sm text-muted-foreground font-sans text-center">
              {format(date!, "PPP")} at {time}
              {location && <><br />{location}</>}
            </p>
            <p className="text-sm text-muted-foreground font-sans">
              {itemCount} item{itemCount !== 1 ? "s" : ""} for collection
            </p>
            <Button variant="outline" className="mt-2 font-sans" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Date picker */}
            <div>
              <label className="block text-sm font-sans font-medium text-foreground mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1.5" />
                Pickup date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time slot selector */}
            <div>
              <label className="block text-sm font-sans font-medium text-foreground mb-2">
                <Clock className="w-4 h-4 inline mr-1.5" />
                Pickup hour
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <Button
                    key={slot}
                    variant={time === slot ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "font-sans text-sm",
                      time === slot && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setTime(slot)}
                  >
                    {slot}
                  </Button>
                ))}
              </div>
            </div>

            {location && (
              <p className="text-sm text-muted-foreground font-sans">
                📍 {location}
              </p>
            )}

            <Button
              onClick={handleConfirm}
              disabled={!date || !time}
              className="w-full h-11 font-sans font-semibold rounded-xl"
            >
              Confirm Pickup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SchedulePickup;
