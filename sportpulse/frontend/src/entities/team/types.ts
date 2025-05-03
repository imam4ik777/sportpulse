export interface Team {
  id: string;
  name: string;
  logo?: string;
  country: string;
  league?: string;
  founded?: number;
  venue?: string;
  coach?: string;
}

export interface TeamFilters {
  name?: string;
  league?: string;
  country?: string;
  letter?: string;
  page?: number;
  limit?: number;
} 