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
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ContactType } from "@prisma/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface BranchContactsProps {
  form: UseFormReturn<BranchFormData>;
}

const contactTypes = [
  { value: ContactType.EMAIL, label: "Email" },
  { value: ContactType.PHONE, label: "Phone" },
  { value: ContactType.WHATSAPP, label: "WhatsApp" },
  { value: ContactType.FACEBOOK, label: "Facebook" },
  { value: ContactType.INSTAGRAM, label: "Instagram" },
  { value: ContactType.TWITTER, label: "Twitter" },
  { value: ContactType.LINKEDIN, label: "LinkedIn" },
  { value: ContactType.OTHER, label: "Other" },
];

export function BranchContacts({ form }: BranchContactsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-4 items-start">
          <div className="flex-1 space-y-4 rounded-lg border p-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`contacts.${index}.type`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {contactTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contacts.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={`contacts.${index}.label`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`contacts.${index}.isMain`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-lg border p-4">
                    <FormLabel>Primary Contact</FormLabel>
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
          </div>

          <Button
            variant="destructive"
            size="icon"
            type="button"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-2"
        onClick={() => append({
          type: ContactType.EMAIL,
          value: '',
          label: '',
          isMain: false,
          order: fields.length
        })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Contact
      </Button>
    </div>
  );
} 