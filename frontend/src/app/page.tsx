"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Building2,
  MapPin,
  Shield,
  Star,
  ArrowRight,
  Home,
  Users,
  Wrench,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import PropertyCard from "@/components/shared/PropertyCard";
import api from "@/lib/api";
import { Property } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

const stats = [
  { label: "Properties Listed", value: "2,500+", icon: Home },
  { label: "Happy Customers", value: "10,000+", icon: Users },
  { label: "Cities Covered", value: "50+", icon: MapPin },
  { label: "Maintenance Resolved", value: "8,000+", icon: Wrench },
];

const features = [
  {
    icon: Search,
    title: "Easy Property Search",
    description: "Find your perfect property with advanced search and filters.",
  },
  {
    icon: Shield,
    title: "Verified Listings",
    description: "All properties are verified by our admin team for safety.",
  },
  {
    icon: Star,
    title: "Trusted Reviews",
    description: "Read genuine reviews from verified tenants and buyers.",
  },
  {
    icon: Wrench,
    title: "Maintenance Support",
    description: "Quick maintenance request handling with dedicated workers.",
  },
];

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    if (!user && isLoading) {
      fetchUser().catch(() => {
        // ignore
      });
      return;
    }
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, fetchUser, router]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await api.get("/properties/featured");
        setFeaturedProperties(data.properties || []);
      } catch {
        // silently fail
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/properties?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!isLoading && user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 min-h-[600px] flex items-center">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Find Your Perfect <br />
              <span className="text-blue-200">Property Today</span>
            </h1>
            <p className="text-lg text-blue-100 mb-8 max-w-xl">
              Discover thousands of verified properties for sale, rent, or
              lease. Your dream home is just a search away.
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="flex gap-2 max-w-xl bg-white rounded-xl p-2 shadow-2xl"
            >
              <div className="flex-1 flex items-center gap-2 pl-3">
                <Search className="h-5 w-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by location, property name..."
                  className="w-full py-2 outline-none text-gray-700 placeholder:text-gray-400"
                />
              </div>
              <Button type="submit" size="lg" className="rounded-lg px-8">
                Search
              </Button>
            </form>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3 mt-6">
              {["Flat", "House", "Villa", "Commercial"].map((type) => (
                <Link
                  key={type}
                  href={`/properties?propertyType=${type.toLowerCase()}`}
                  className="px-4 py-2 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  {type}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                Featured Properties
              </h2>
              <p className="text-gray-500 mt-2">
                Hand-picked properties for you
              </p>
            </div>
            <Link
              href="/properties"
              className="hidden sm:flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.slice(0, 6).map((property, index) => (
                <motion.div
                  key={property._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Home className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No featured properties yet</p>
              <Link href="/properties" className="text-blue-600 mt-2 inline-block">
                Browse all properties
              </Link>
            </div>
          )}

          <div className="sm:hidden text-center mt-8">
            <Link href="/properties">
              <Button variant="outline">View All Properties</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose PropertyManager?
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We provide the best experience for property seekers and owners
              alike.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow border"
              >
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to List Your Property?
            </h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Join thousands of property owners who trust PropertyManager to
              manage their listings.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/properties">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Browse Properties
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
