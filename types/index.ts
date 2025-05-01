import { Role } from "@prisma/client";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export Role enum from Prisma
export { Role }; 