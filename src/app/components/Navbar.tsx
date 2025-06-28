"use client";

import { useState } from "react";
import { Menu, Search, X, Sun, Moon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/ndb.png";

interface NavbarProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({
  categories,
  selectedCategory,
  setSelectedCategory,
  darkMode,
  toggleDarkMode,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setMobileMenuOpen(false); // Close mobile menu on category select
  };

  return (
    <header className="bg-white text-gray-800 shadow-md sticky top-0 z-50">
      <div className="w-full container mx-auto px-4 lg:px-8 py-2 lg:py-6">
        <div className="flex items-center justify-between">
          {/* Logo and mobile menu */}
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 text-gray-800 hover:text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" className="flex items-center">
              <Image
                src={logo}
                alt="Logo"
                className="h-8 lg:h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="hidden lg:flex space-x-8 items-center text-sm font-semibold uppercase">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => handleCategoryClick(item)}
                className={`hover:text-gray-600 transition ${
                  selectedCategory === item ? "text-red-600 font-bold" : ""
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Search and Dark Mode Toggle */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-800 hover:text-gray-600">
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white px-4 py-4 space-y-2 text-gray-800 font-semibold border-t border-gray-200">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => handleCategoryClick(item)}
              className={`block w-full text-left hover:text-gray-600 ${
                selectedCategory === item ? "text-red-600 font-bold" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}