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
    setSelectedCategory(category === selectedCategory ? "" : category);
    setMobileMenuOpen(false); // Close mobile menu on category select
  };

  const handleHomeClick = () => {
    setSelectedCategory(""); // Reset to default view
    setMobileMenuOpen(false); // Close mobile menu
  };

  return (
    <header
      className={`sticky top-0 z-50 shadow-md ${
        darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8 py-2 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo and mobile menu */}
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 hover:text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link href="/" onClick={handleHomeClick} className="flex items-center">
              <Image
                src={logo}
                alt="Naija Daily Logo"
                className="h-8 lg:h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Nav Items */}
          <nav className="hidden lg:flex space-x-6 items-center text-sm font-semibold uppercase">
            <button
              onClick={handleHomeClick}
              className={`relative px-2 py-1 transition-colors duration-200 ${
                selectedCategory === ""
                  ? "text-red-600 font-bold border-b-2 border-red-600"
                  : "hover:text-gray-600"
              }`}
            >
              Home
            </button>
            {categories.map((item, index) => (
              <button
                key={`${item}-${index}`}
                onClick={() => handleCategoryClick(item)}
                className={`relative px-2 py-1 transition-colors duration-200 ${
                  selectedCategory === item
                    ? "text-red-600 font-bold border-b-2 border-red-600"
                    : "hover:text-gray-600"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          {/* Search and Dark Mode Toggle */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:text-gray-600">
              <Search size={20} />
            </button>
            <button
              className="p-2 hover:text-gray-600"
              onClick={toggleDarkMode}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden px-4 py-4 space-y-2 border-t border-gray-200 ${
            darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
          }`}
        >
          <button
            onClick={handleHomeClick}
            className={`block w-full text-left py-2 px-4 transition-colors duration-200 ${
              selectedCategory === ""
                ? "text-red-600 font-bold bg-red-100 dark:bg-red-900 rounded"
                : "hover:text-gray-600"
            }`}
          >
            Home
          </button>
          {categories.map((item, index) => (
            <button
              key={`${item}-${index}`}
              onClick={() => handleCategoryClick(item)}
              className={`block w-full text-left py-2 px-4 transition-colors duration-200 ${
                selectedCategory === item
                  ? "text-red-600 font-bold bg-red-100 dark:bg-red-900 rounded"
                  : "hover:text-gray-600"
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