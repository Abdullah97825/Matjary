"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { BranchFormData } from "@/schemas/contact";

interface BusinessHoursProps {
  form: UseFormReturn<BranchFormData>;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function BusinessHours({ form }: BusinessHoursProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Business Hours</h3>
      <div className="grid grid-cols-1 gap-4">
        {DAYS.map((day, index) => (
          <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center p-4 border rounded-lg">
            <div className="font-medium">{day}</div>
            
            <FormField
              control={form.control}
              name={`businessHours.${index}.isClosed`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Closed</FormLabel>
                </FormItem>
              )}
            />

            {!form.watch(`businessHours.${index}.isClosed`) && (
              <>
                <FormField
                  control={form.control}
                  name={`businessHours.${index}.openTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
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
                      <FormLabel>Close Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 