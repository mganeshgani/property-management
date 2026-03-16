"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  MapPin,
  Maximize,
  Phone,
  Share2,
  Star,
  User,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import StarRating from "@/components/shared/StarRating";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import api from "@/lib/api";
import { Property, Review, User as UserType } from "@/lib/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function PropertyDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Booking form state
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    message: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Review form state
  const [reviewData, setReviewData] = useState({ rating: 0, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [completedBookingId, setCompletedBookingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/properties/${slug}`);
        setProperty(data.property);

        // Fetch reviews
        try {
          const reviewRes = await api.get(`/reviews/property/${data.property._id}`);
          setReviews(reviewRes.data.reviews || reviewRes.data.data || []);
        } catch {
          // silently fail
        }
      } catch {
        toast.error("Property not found");
        router.push("/properties");
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProperty();
  }, [slug, router]);

  // Fetch user's completed booking for this property (for review eligibility)
  useEffect(() => {
    const fetchCompletedBooking = async () => {
      if (!user || user.role !== "customer" || !property) return;
      try {
        const { data } = await api.get(`/bookings/my-bookings?status=completed`);
        const bookings = data.bookings || data.data || [];
        const match = bookings.find(
          (b: any) =>
            (b.property?._id || b.property) === property._id
        );
        if (match) setCompletedBookingId(match._id);
      } catch {
        // silently fail
      }
    };
    fetchCompletedBooking();
  }, [user, property]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to book");
      router.push("/auth/login");
      return;
    }
    setBookingLoading(true);
    try {
      await api.post("/bookings", {
        propertyId: property?._id,
        bookingType: property?.listingType === "rent" ? "rent" : property?.listingType === "sale" ? "buy" : "visit",
        moveInDate: bookingData.checkIn,
        moveOutDate: bookingData.checkOut,
        notes: bookingData.message,
      });
      toast.success("Booking request sent!");
      setShowBookingForm(false);
      setBookingData({ checkIn: "", checkOut: "", message: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to review");
      return;
    }
    setReviewLoading(true);
    try {
      await api.post("/reviews", {
        propertyId: property?._id,
        bookingId: completedBookingId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      toast.success("Review submitted!");
      setReviewData({ rating: 0, comment: "" });
      // Refresh reviews
      const reviewRes = await api.get(`/reviews/property/${property?._id}`);
      setReviews(reviewRes.data.reviews || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Review failed");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!property) return null;

  const images = property.images || [];
  const owner = property.owner as UserType;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to properties
        </button>

        {/* Image Gallery */}
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gray-200">
          <div className="aspect-[16/9] md:aspect-[21/9] relative">
            {images.length > 0 ? (
              <Image
                src={images[currentImage]?.url || "/placeholder.jpg"}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <p className="text-gray-400">No images available</p>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentImage(
                      currentImage === 0 ? images.length - 1 : currentImage - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() =>
                    setCurrentImage(
                      currentImage === images.length - 1 ? 0 : currentImage + 1
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === currentImage ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="hidden md:flex gap-2 p-2 bg-white">
              {images.slice(0, 6).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 ${
                    i === currentImage
                      ? "border-blue-600"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        property.listingType === "sale"
                          ? "default"
                          : property.listingType === "rent"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      For {property.listingType}
                    </Badge>
                    {property.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {property.title}
                  </h1>
                  <p className="flex items-center gap-1 text-gray-500 mt-1">
                    <MapPin className="h-4 w-4" />
                    {property.location?.address || "Location not specified"}
                    {property.location?.city && `, ${property.location.city}`}
                    {property.location?.state && `, ${property.location.state}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(property.price)}
                  </p>
                  {property.listingType === "rent" && (
                    <span className="text-sm text-gray-500">/month</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="flex flex-wrap gap-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">
                    <strong>{property.bedrooms}</strong> Bedrooms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">
                    <strong>{property.bathrooms}</strong> Bathrooms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Maximize className="h-5 w-5 text-gray-400" />
                  <span className="text-sm">
                    <strong>{property.area}</strong> sq ft
                  </span>
                </div>
                {property.furnishing && (
                  <Badge variant="outline" className="capitalize">
                    {property.furnishing}
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 border">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="bg-white rounded-xl p-6 border">
                <h2 className="text-lg font-semibold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-xl p-6 border">
              <h2 className="text-lg font-semibold mb-4">
                Reviews ({reviews.length})
              </h2>

              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {(review.reviewer as any)?.firstName || "User"}{" "}
                              {(review.reviewer as any)?.lastName || ""}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(review.createdAt)}
                            </p>
                          </div>
                        </div>
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 ml-13">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No reviews yet.</p>
              )}

              {/* Review Form */}
              {user && user.role === "customer" && completedBookingId && (
                <form onSubmit={handleReview} className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-3">Leave a Review</h3>
                  <div className="mb-3">
                    <StarRating
                      value={reviewData.rating}
                      onChange={(val) =>
                        setReviewData({ ...reviewData, rating: val })
                      }
                    />
                  </div>
                  <textarea
                    value={reviewData.comment}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, comment: e.target.value })
                    }
                    placeholder="Write your review..."
                    className="w-full border rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="mt-2"
                    disabled={reviewLoading || reviewData.rating === 0}
                  >
                    {reviewLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Submit Review
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <div className="bg-white rounded-xl p-6 border sticky top-24">
              <h3 className="font-semibold mb-4">Listed by</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {owner?.firstName || "Property"} {owner?.lastName || "Owner"}
                  </p>
                  <p className="text-xs text-gray-500">Property Owner</p>
                </div>
              </div>

              {/* Booking Button */}
              {user?.role === "customer" && property.status === "available" && (
                <>
                  {!showBookingForm ? (
                    <Button
                      className="w-full"
                      onClick={() => setShowBookingForm(true)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Now
                    </Button>
                  ) : (
                    <form onSubmit={handleBooking} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Check-in Date
                        </label>
                        <input
                          type="date"
                          value={bookingData.checkIn}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              checkIn: e.target.value,
                            })
                          }
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Check-out Date
                        </label>
                        <input
                          type="date"
                          value={bookingData.checkOut}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              checkOut: e.target.value,
                            })
                          }
                          min={bookingData.checkIn || new Date().toISOString().split("T")[0]}
                          className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700">
                          Message (optional)
                        </label>
                        <textarea
                          value={bookingData.message}
                          onChange={(e) =>
                            setBookingData({
                              ...bookingData,
                              message: e.target.value,
                            })
                          }
                          placeholder="Any special requests..."
                          className="w-full mt-1 border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setShowBookingForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="flex-1"
                          disabled={bookingLoading}
                        >
                          {bookingLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Confirm"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {!user && (
                <Link href="/auth/login">
                  <Button className="w-full">Login to Book</Button>
                </Link>
              )}

              {/* Property Details */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Property Type</span>
                  <span className="font-medium capitalize">
                    {property.propertyType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Listing Type</span>
                  <span className="font-medium capitalize">
                    {property.listingType}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Area</span>
                  <span className="font-medium">{property.area} sq ft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Listed On</span>
                  <span className="font-medium">
                    {formatDate(property.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
