"use client";

import { useState } from "react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, Plus, ArrowLeftRight, Search, Loader2 } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import Image from "next/image";
import toast from "react-hot-toast";

export default function ComparePage() {
  const [properties, setProperties] = useState<(Property | null)[]>([
    null,
    null,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const fetchAvailableProperties = async (query = "") => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "12");
      params.set("sort", "newest");
      if (query.trim()) {
        params.set("search", query.trim());
      }
      const { data } = await api.get(`/properties?${params.toString()}`);
      setSearchResults(data.properties || []);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setSearchLoading(false);
    }
  };

  const searchProperties = async () => {
    await fetchAvailableProperties(searchQuery);
  };

  useEffect(() => {
    if (activeSlot !== null) {
      fetchAvailableProperties();
    }
  }, [activeSlot]);

  const addProperty = (property: Property, slot: number) => {
    const updated = [...properties];
    updated[slot] = property;
    setProperties(updated);
    setActiveSlot(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeProperty = (slot: number) => {
    const updated = [...properties];
    updated[slot] = null;
    setProperties(updated);
  };

  const addSlot = () => {
    if (properties.length < 4) {
      setProperties([...properties, null]);
    }
  };

  const compareFields = [
    { label: "Price", key: "price", format: (v: any) => formatPrice(v) },
    { label: "Type", key: "propertyType", format: (v: any) => v },
    { label: "Listing", key: "listingType", format: (v: any) => `For ${v}` },
    { label: "Bedrooms", key: "bedrooms", format: (v: any) => v },
    { label: "Bathrooms", key: "bathrooms", format: (v: any) => v },
    { label: "Area", key: "area", format: (v: any) => `${v} sq ft` },
    { label: "Furnishing", key: "furnishing", format: (v: any) => v || "N/A" },
    {
      label: "Amenities",
      key: "amenities",
      format: (v: any) => (v?.length ? v.join(", ") : "None"),
    },
  ];

  const filledProperties = properties.filter(Boolean) as Property[];
  const selectedPropertyIds = new Set(
    properties.filter(Boolean).map((property) => (property as Property)._id)
  );
  const displayResults = searchResults.filter(
    (result) => !selectedPropertyIds.has(result._id)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <ArrowLeftRight className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Compare Properties
              </h1>
              <p className="text-gray-500 text-sm">
                Compare up to 4 properties side by side
              </p>
            </div>
          </div>

          {/* Property Slots */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {properties.map((property, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border overflow-hidden"
              >
                {property ? (
                  <div>
                    <div className="relative aspect-video">
                      {property.images?.[0]?.url ? (
                        <Image
                          src={property.images[0].url}
                          alt={property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <p className="text-gray-400 text-sm">No image</p>
                        </div>
                      )}
                      <button
                        onClick={() => removeProperty(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm truncate">
                        {property.title}
                      </h3>
                      <p className="text-blue-600 font-bold mt-1">
                        {formatPrice(property.price)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveSlot(index)}
                    className="w-full aspect-video flex flex-col items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors p-6"
                  >
                    <Plus className="h-8 w-8 mb-2" />
                    <span className="text-sm">Add Property</span>
                  </button>
                )}
              </div>
            ))}

            {properties.length < 4 && (
              <button
                onClick={addSlot}
                className="bg-white rounded-xl border border-dashed flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-300 transition-colors min-h-[200px]"
              >
                <Plus className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Search Modal */}
          {activeSlot !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Search Property</h3>
                  <button onClick={() => setActiveSlot(null)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      if (!value.trim()) {
                        fetchAvailableProperties("");
                      }
                    }}
                    placeholder="Search by name or location..."
                    onKeyDown={(e) => e.key === "Enter" && searchProperties()}
                  />
                  <Button onClick={searchProperties} disabled={searchLoading}>
                    {searchLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600">
                    Available Properties
                  </p>
                  <p className="text-xs text-gray-500">
                    {displayResults.length} found
                  </p>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {displayResults.map((result) => (
                    <button
                      key={result._id}
                      onClick={() => addProperty(result, activeSlot)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-left border"
                    >
                      <div className="relative w-16 h-12 rounded overflow-hidden shrink-0">
                        {result.images?.[0]?.url ? (
                          <Image
                            src={result.images[0].url}
                            alt={result.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(result.price)}
                        </p>
                      </div>
                    </button>
                  ))}
                  {displayResults.length === 0 && !searchLoading && (
                    <p className="text-center text-sm text-gray-500 py-4">
                      No available properties found
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {filledProperties.length >= 2 && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {compareFields.map((field) => (
                      <tr key={field.key} className="border-b last:border-0">
                        <td className="px-6 py-4 font-medium text-sm text-gray-700 bg-gray-50 w-40">
                          {field.label}
                        </td>
                        {properties.map(
                          (prop, i) =>
                            prop && (
                              <td
                                key={i}
                                className="px-6 py-4 text-sm text-gray-600"
                              >
                                {field.format(
                                  (prop as any)[field.key]
                                )}
                              </td>
                            )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
