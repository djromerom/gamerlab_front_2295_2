"use client";

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import PurpleButton from "./PurpleButton";

export default function navBar(): React.ReactElement {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/10 backdrop-blur-md py-4 border-b border-white/10">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/Arkad.svg" // Path to your logo
                alt="Logo"
                className="h-auto w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden space-x-8 md:flex">
            <Link
              to="/equipos"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Equipos
            </Link>
            <Link
              to="/ranking"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Ranking
            </Link>
            <Link
              to="/informacion"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Información
            </Link>
            <Link
              to="/contribuidores"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Contribuidores
            </Link>
          </nav>

          {/* CTA Button + Mobile Menu Toggle */}
          <div className="flex items-center">
            <Link to="/login">
              <PurpleButton className="cursor-pointer">
                Inicia sesión
              </PurpleButton>
            </Link>
            <button
              className="ml-4 text-white md:hidden cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col space-y-4 pb-4 pt-6">
            <Link
              to="/features"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Equipos
            </Link>
            <Link
              to="/ranking"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Ranking
            </Link>
            <Link
              to="/informacion"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Información
            </Link>
            <Link
              to="/contribuidores"

              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Contribuidores
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
