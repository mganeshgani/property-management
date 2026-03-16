"use client";

import { useEffect, useState } from "react";
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
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import Link from "next/link";
import axios from "axios";

const propertyTypes = ["house", "flat", "villa", "plot", "commercial"];
const listingTypes = ["sale", "rent", "lease"];
const furnishingOptions = ["furnished", "semi", "unfurnished"];
const amenitiesList = [
  "WiFi", "Parking", "Swimming Pool", "Gym", "Security", "Power Backup",
  "Lift", "Garden", "Clubhouse", "CCTV", "Fire Safety", "Water Supply",
  "Gas Pipeline", "AC", "Intercom", "Waste Management",
];

export default function EditPropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ url: string; publicId: string }[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/properties/detail/${id}`);
        const property = data.data;
        reset({
          title: property.title,
          description: property.description,
          propertyType: property.propertyType,
          listingType: property.listingType,
          price: property.price,
          priceUnit: property.priceUnit || "total",
          area: property.area,
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          floors: property.floors || 1,
          furnishing: property.furnishing || "unfurnished",
          location: {
            address: property.location?.address || "",
            city: property.location?.city || "",
            state: property.location?.state || "",
            pincode: property.location?.pincode || "",
            country: property.location?.country || "India",
          },
        });
        setExistingImages(property.images || []);
        setSelectedAmenities(property.amenities || []);
      } catch {
        toast.error("Failed to load property");
        router.push("/dashboard/owner/properties");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProperty();
  }, [id, reset, router]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleRemoveExisting = (publicId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
    setRemovedImages((prev) => [...prev, publicId]);
  };

  const onSubmit = async (data: PropertyInput) => {
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

      selectedAmenities.forEach((a) => formData.append("amenities", a));
      removedImages.forEach((id) => formData.append("removedImages", id));
      images.forEach((img) => formData.append("images", img));

      await api.put(`/properties/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Property updated!");
      router.push("/dashboard/owner/properties");
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast.error(message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/owner/properties">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input {...register("title")} error={errors.title?.message} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...register("description")} error={errors.description?.message} className="h-32" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Property Type</Label>
                <select {...register("propertyType")} className="w-full mt-1 border rounded-md px-3 py-2 text-sm">
                  {propertyTypes.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div>
                <Label>Listing Type</Label>
                <select {...register("listingType")} className="w-full mt-1 border rounded-md px-3 py-2 text-sm">
                  {listingTypes.map((t) => (<option key={t} value={t}>For {t}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" {...register("price", { valueAsNumber: true })} error={errors.price?.message} />
              </div>
              <div>
                <Label>Area (sq ft)</Label>
                <Input type="number" {...register("area", { valueAsNumber: true })} error={errors.area?.message} />
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
                  {furnishingOptions.map((f) => (<option key={f} value={f}>{f}</option>))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Location</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Address</Label><Input {...register("location.address")} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>City</Label><Input {...register("location.city")} /></div>
              <div><Label>State</Label><Input {...register("location.state")} /></div>
              <div><Label>Pincode</Label><Input {...register("location.pincode")} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity) => (
                <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedAmenities.includes(amenity) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                  }`}
                >{amenity}</button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Property Images</CardTitle></CardHeader>
          <CardContent>
            <ImageUpload
              images={images}
              setImages={setImages}
              existingImages={existingImages}
              onRemoveExisting={handleRemoveExisting}
              maxImages={10}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/owner/properties"><Button variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</>) : "Update Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}
