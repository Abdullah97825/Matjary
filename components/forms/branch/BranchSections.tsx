"use client";

import { UseFormReturn, useFieldArray } from "react-hook-form";
import { BranchFormData } from "@/schemas/contact";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface BranchSectionsProps {
  form: UseFormReturn<BranchFormData>;
}

export function BranchSections({ form }: BranchSectionsProps) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between mb-4">
            <FormField
              control={form.control}
              name={`sections.${index}.isEnabled`}
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm text-muted-foreground">Enabled</FormLabel>
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              )}
              {index < fields.length - 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name={`sections.${index}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`sections.${index}.content`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({
          title: '',
          content: '',
          order: fields.length,
          isEnabled: true
        })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Section
      </Button>
    </div>
  );
} 