export interface Address {
  id: string;
  country: string;
  province: string;
  city: string;
  neighbourhood: string;
  nearestLandmark: string;
  zipcode: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressFormData {
  country: string;
  province: string;
  city: string;
  neighbourhood: string;
  nearestLandmark: string;
  zipcode: string;
  isDefault: boolean;
} 