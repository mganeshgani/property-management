"use client";

import Link from "next/link";
import { Property } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Maximize, Heart } from "lucide-react";
import { useState } from "react";

interface PropertyCardProps {
  property: Property;
  showStatus?: boolean;
}

export default function PropertyCard({ property, showStatus }: PropertyCardProps) {
  const [liked, setLiked] = useState(false);
  const owner = typeof property.owner === "object" ? property.owner : null;

  const imageUrl = property.images?.[0]?.url || "/placeholder-property.jpg";

  const priceLabel = property.priceUnit === "per_month"
    ? "/mo"
    : property.priceUnit === "per_year"
    ? "/yr"
    : "";

  return (
    <Link href={`/properties/${property.slug}`} className="group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="bg-blue-600 text-white text-xs font-medium px-2.5 py-1 rounded-full capitalize">
              {property.listingType}
            </span>
            {property.isFeatured && (
              <span className="bg-yellow-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                Featured
              </span>
            )}
          </div>
          {showStatus && (
            <div className="absolute top-3 right-3">
              <StatusBadge status={property.status} />
            </div>
          )}
          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked(!liked);
            }}
            className="absolute bottom-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
            {property.title}
          </h3>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {property.location.city}, {property.location.state}
          </p>

          {/* Features */}
          {property.propertyType !== "plot" && (
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bed className="h-4 w-4" />
                  {property.bedrooms}
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1">
                  <Bath className="h-4 w-4" />
                  {property.bathrooms}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Maximize className="h-4 w-4" />
                {property.area} sqft
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(property.price)}
              <span className="text-sm font-normal text-gray-500">{priceLabel}</span>
            </span>
            <span className="text-xs text-gray-400 capitalize bg-gray-100 px-2 py-1 rounded-full">
              {property.propertyType}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
