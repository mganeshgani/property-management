"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
}

interface Filters {
  search: string;
  propertyType: string;
  listingType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  bathrooms: string;
  furnishing: string;
  sortBy: string;
}

interface FilterSidebarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  className?: string;
}

const propertyTypes: FilterOption[] = [
  { label: "All Types", value: "" },
  { label: "Flat", value: "flat" },
  { label: "House", value: "house" },
  { label: "Villa", value: "villa" },
  { label: "Plot", value: "plot" },
  { label: "Commercial", value: "commercial" },
];

const listingTypes: FilterOption[] = [
  { label: "All", value: "" },
  { label: "For Sale", value: "sale" },
  { label: "For Rent", value: "rent" },
  { label: "Lease", value: "lease" },
];

const furnishingOptions: FilterOption[] = [
  { label: "Any", value: "" },
  { label: "Furnished", value: "furnished" },
  { label: "Semi-Furnished", value: "semi" },
  { label: "Unfurnished", value: "unfurnished" },
];

const sortOptions: FilterOption[] = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Most Popular", value: "most_viewed" },
];

const bedroomOptions = ["Any", "1", "2", "3", "4", "5+"];

export default function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
  className,
}: FilterSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilter = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => key !== "sortBy" && val !== ""
  );

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Property Type</label>
        <select
          value={filters.propertyType}
          onChange={(e) => updateFilter("propertyType", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {propertyTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Listing Type */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Listing Type</label>
        <div className="flex flex-wrap gap-2">
          {listingTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => updateFilter("listingType", t.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filters.listingType === t.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => updateFilter("minPrice", e.target.value)}
          />
          <span className="text-gray-400">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => updateFilter("maxPrice", e.target.value)}
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Bedrooms</label>
        <div className="flex flex-wrap gap-2">
          {bedroomOptions.map((opt) => {
            const val = opt === "Any" ? "" : opt.replace("+", "");
            return (
              <button
                key={opt}
                onClick={() => updateFilter("bedrooms", val)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                  filters.bedrooms === val
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Furnishing */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Furnishing</label>
        <select
          value={filters.furnishing}
          onChange={(e) => updateFilter("furnishing", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {furnishingOptions.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter("sortBy", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {sortOptions.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={onReset} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setMobileOpen(true)}
          className="w-full"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={cn("hidden lg:block", className)}>
        <div className="bg-white rounded-lg border p-6 sticky top-24">
          <h3 className="font-semibold text-lg mb-6">Filters</h3>
          <FilterContent />
        </div>
      </div>
    </>
  );
}
