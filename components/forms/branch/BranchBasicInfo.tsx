"use client";

import { UseFormReturn } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { MapPreview } from "./MapPreview";

interface BranchBasicInfoProps {
  form: UseFormReturn<BranchFormData>;
}

export function BranchBasicInfo({ form }: BranchBasicInfoProps) {
  const mapEnabled = form.watch("mapEnabled");
  const latitude = form.watch("latitude") ?? 0;
  const longitude = form.watch("longitude") ?? 0;
  const zoomLevel = form.watch("mapZoomLevel") ?? 14;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Branch Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter branch name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isMain"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Main Branch</FormLabel>
              <div className="text-sm text-muted-foreground">
                Set this as the main branch location
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="123 Business Street..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mapEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel>Enable Map</FormLabel>
              <div className="text-sm text-muted-foreground">
                Show location on map
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {mapEnabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      step="any"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value ?? ''}
                      type="number"
                      step="any"
                      onChange={e => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <MapPreview
            latitude={latitude}
            longitude={longitude}
            zoom={zoomLevel}
            onLocationChange={(lat, lng) => {
              form.setValue("latitude", lat);
              form.setValue("longitude", lng);
            }}
            onZoomChange={(zoom) => {
              form.setValue("mapZoomLevel", zoom);
            }}
          />
        </div>
      )}
    </div>
  );
} 