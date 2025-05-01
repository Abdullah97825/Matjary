"use client";

import { UseFormReturn, useWatch } from "react-hook-form";
import { BranchFormData } from "@/schemas/contact";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface BranchHoursProps {
  form: UseFormReturn<BranchFormData>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function BranchHours({ form }: BranchHoursProps) {
  const businessHours = useWatch({
    control: form.control,
    name: "businessHours"
  });

  return (
    <div className="space-y-4">
      {DAYS.map((day, index) => {
        const isClosed = businessHours?.[index]?.isClosed;

        return (
          <div key={day} className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{day}</h4>
              <FormField
                control={form.control}
                name={`businessHours.${index}.isClosed`}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormLabel className="text-sm text-muted-foreground">Closed</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {!isClosed && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`businessHours.${index}.openTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opening Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`businessHours.${index}.closeTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Closing Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value || ""}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 