export interface BundleItem {
  id: string;
  bundleId: string;
  title: string;
  url: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional display fields (not stored, computed from URL/metadata)
  description?: string;
  estimatedPrice?: number;
}

export interface BundleContribution {
  guestName?: string;
  amount: number;
  message?: string;
  createdAt: Date;
}

export interface Bundle {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  targetAmount: number;
  suggestedAmounts?: number[];
  currentAmount?: number; // calculated from contributions
  imageUrl?: string;
  storeDomain: string;
  items: BundleItem[];
  isVisible: boolean;
  position: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
}
