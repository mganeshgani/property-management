import Link from "next/link";
import { Building2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold text-white">PropertyManager</span>
            </Link>
            <p className="text-sm text-gray-400">
              Your trusted platform for finding and managing properties. Buy, rent, or lease with confidence.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/properties" className="hover:text-white transition-colors">Browse Properties</Link></li>
              <li><Link href="/properties?listingType=rent" className="hover:text-white transition-colors">Rent a Home</Link></li>
              <li><Link href="/properties?listingType=sale" className="hover:text-white transition-colors">Buy a Home</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare Properties</Link></li>
            </ul>
          </div>

          {/* For Owners */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Owners</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/register" className="hover:text-white transition-colors">List Your Property</Link></li>
              <li><Link href="/dashboard/owner" className="hover:text-white transition-colors">Owner Dashboard</Link></li>
              <li><Link href="/dashboard/owner/properties/add" className="hover:text-white transition-colors">Add Property</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-white transition-colors cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Contact Us</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} PropertyManager. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
