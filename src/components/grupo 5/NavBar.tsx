"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User } from "lucide-react";
import PurpleButton from "./PurpleButton";
import { useAuth } from "@/contexts/AuthContext";
export default function navBar(): React.ReactElement {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const shortName = user?.firstName + " " + user?.lastName.charAt(0) + ".";


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
              Videojuegos
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
              to="/ediciones-pasadas"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Ediciones Pasadas
            </Link>
            <Link
              to="/contribuidores"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Contribuidores
            </Link>
          </nav>

          {/* CTA Button / User Menu + Mobile Toggle */}
          <div className="flex items-center relative">

            {/* If not logged in, Login Button */}
            {!user && (
              <div className="w-[150px]">
                <Link to="/login">
                  <PurpleButton className="cursor-pointer w-full text-center">
                    Inicia sesión
                  </PurpleButton>
                </Link>
              </div>
            )}

            {/* If logged in, dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <div className="w-[150px]">
                  <PurpleButton
                    className="cursor-pointer w-full text-center"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <User size={16} />
                      <span className="truncate">{shortName}</span>
                    </div>
                  </PurpleButton>
                </div>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg py-2 shadow-lg">
                    <Link
                      to="/inicio"
                      className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Mi dashboard
                    </Link>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await logout();
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile toggle */}
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
              to="/equipos"
              onClick={() => setIsMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Videojuegos
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
