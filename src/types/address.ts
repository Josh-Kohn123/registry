export interface Address {
  id: string;
  profileId: string;
  recipientName: string;
  phone?: string;
  city: string;
  line1: string;
  line2?: string;
  postalCode?: string;
  notes?: string;
  isDefault?: boolean;
  encryptedData: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressInput {
  recipientName: string;
  phone?: string;
  city: string;
  line1: string;
  line2?: string;
  postalCode?: string;
  notes?: string;
  isDefault?: boolean;
}

export interface PublicAddressReveal {
  id: string;
  recipientName: string;
  phone?: string;
  city: string;
  line1: string;
  line2?: string;
  postalCode?: string;
  notes?: string;
}
