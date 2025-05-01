import { AddressFormData } from "./address";

export interface RegisterFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirmation: string;
  address: AddressFormData;
}

export interface LoginFormData {
  email: string;
  password: string;
} 