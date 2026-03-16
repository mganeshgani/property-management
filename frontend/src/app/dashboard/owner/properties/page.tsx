"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Building2, Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import EmptyState from "@/components/shared/EmptyState";
import Link from "next/link";
import Image from "next/image";

export default function OwnerPropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/properties/owner/my-listings");
      setProperties(data.properties || []);
    } catch {
      toast.error("Failed to load properties");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    try {
      await api.delete(`/properties/${id}`);
      toast.success("Property deleted!");
      fetchProperties();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
        <Link href="/dashboard/owner/properties/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          title="No properties listed"
          description="Start by adding your first property listing."
          actionLabel="Add Property"
          actionHref="/dashboard/owner/properties/add"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((property, index) => (
            <motion.div
              key={property._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
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
                      <Building2 className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[property.status] || "bg-gray-100 text-gray-700"}`}>
                      {property.status}
                    </span>
                  </div>
                  {property.isFeatured && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
                  <p className="text-blue-600 font-bold text-lg mb-2">
                    {formatPrice(property.price)}
                    {property.listingType === "rent" && <span className="text-sm font-normal text-gray-500">/month</span>}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {property.bedrooms} beds &bull; {property.bathrooms} baths &bull; {property.area} sqft
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href={`/properties/${property.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/dashboard/owner/properties/${property._id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(property._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
