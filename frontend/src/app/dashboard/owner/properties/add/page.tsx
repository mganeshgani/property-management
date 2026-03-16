"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema, PropertyInput } from "@/lib/validations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/shared/ImageUpload";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import Link from "next/link";

const propertyTypes = ["house", "flat", "villa", "plot", "commercial"];
const listingTypes = ["sale", "rent", "lease"];
const furnishingOptions = ["furnished", "semi", "unfurnished"];
const amenitiesList = [
  "WiFi", "Parking", "Swimming Pool", "Gym", "Security", "Power Backup",
  "Lift", "Garden", "Clubhouse", "CCTV", "Fire Safety", "Water Supply",
  "Gas Pipeline", "AC", "Intercom", "Waste Management",
];

export default function AddPropertyPage() {
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      propertyType: "flat",
      listingType: "rent",
      priceUnit: "total",
      furnishing: "unfurnished",
      bedrooms: 0,
      bathrooms: 0,
      floors: 1,
      location: {
        address: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      },
    },
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  const onSubmit = async (data: PropertyInput) => {
    if (images.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("propertyType", data.propertyType);
      formData.append("listingType", data.listingType);
      formData.append("price", String(data.price));
      formData.append("priceUnit", data.priceUnit);
      formData.append("area", String(data.area));
      formData.append("bedrooms", String(data.bedrooms));
      formData.append("bathrooms", String(data.bathrooms));
      formData.append("floors", String(data.floors));
      formData.append("furnishing", data.furnishing);
      formData.append("location", JSON.stringify(data.location));

      // Add amenities
      selectedAmenities.forEach((a) => formData.append("amenities", a));

      // Add images
      images.forEach((img) => formData.append("images", img));

      await api.post("/properties", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Property listed successfully! Pending admin approval.");
      router.push("/dashboard/owner/properties");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create property");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/owner/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input {...register("title")} error={errors.title?.message} placeholder="e.g., Spacious 2BHK in Koramangala" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...register("description")} error={errors.description?.message} placeholder="Describe your property..." className="h-32" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property Type</Label>
                <select {...register("propertyType")} className="w-full mt-1 border rounded-md px-3 py-2 text-sm">
                  {propertyTypes.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Listing Type</Label>
                <select {...register("listingType")} className="w-full mt-1 border rounded-md px-3 py-2 text-sm">
                  {listingTypes.map((t) => (
                    <option key={t} value={t} className="capitalize">For {t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" {...register("price", { valueAsNumber: true })} error={errors.price?.message} placeholder="e.g., 25000" />
              </div>
              <div>
                <Label>Area (sq ft)</Label>
                <Input type="number" {...register("area", { valueAsNumber: true })} error={errors.area?.message} placeholder="e.g., 1200" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Bedrooms</Label>
                <Input type="number" {...register("bedrooms", { valueAsNumber: true })} error={errors.bedrooms?.message} />
              </div>
              <div>
                <Label>Bathrooms</Label>
                <Input type="number" {...register("bathrooms", { valueAsNumber: true })} error={errors.bathrooms?.message} />
              </div>
              <div>
                <Label>Furnishing</Label>
                <select {...register("furnishing")} className="w-full mt-1 border rounded-md px-3 py-2 text-sm">
                  {furnishingOptions.map((f) => (
                    <option key={f} value={f} className="capitalize">{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Address</Label>
              <Input {...register("location.address")} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input {...register("location.city")} placeholder="e.g., Bangalore" />
              </div>
              <div>
                <Label>State</Label>
                <Input {...register("location.state")} placeholder="e.g., Karnataka" />
              </div>
              <div>
                <Label>Pincode</Label>
                <Input {...register("location.pincode")} placeholder="e.g., 560034" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedAmenities.includes(amenity)
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Property Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUpload images={images} setImages={setImages} maxImages={10} />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/owner/properties">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Property"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
