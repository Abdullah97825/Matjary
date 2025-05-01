import { Branch, ContactDetail, BusinessHours, BranchSection } from "@prisma/client";

export type BranchWithRelations = Branch & {
  contacts: ContactDetail[];
  businessHours: BusinessHours[];
  sections: BranchSection[];
}; 