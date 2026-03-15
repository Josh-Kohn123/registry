export interface ProductLink {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  url: string;
  retailerDomain: string;
  imageUrl?: string;
  estimatedPrice?: number;
  previousPrice?: number;
  lastPriceFetch?: Date;
  isVisible: boolean;
  clickCount: number;
  position?: number; // for ordering
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface FetchedMetadata {
  title?: string;
  image?: string;
  price?: number;
  domain?: string;
}

export interface MetadataFetchRequest {
  url: string;
}

export interface MetadataFetchResponse {
  success: boolean;
  data?: FetchedMetadata;
  error?: string;
}

export interface ProductCreateRequest {
  url: string;
  title?: string;
  imageUrl?: string;
  estimatedPrice?: number;
}

export interface ProductUpdateRequest {
  title?: string;
  imageUrl?: string;
  estimatedPrice?: number;
  isVisible?: boolean;
  position?: number;
}
