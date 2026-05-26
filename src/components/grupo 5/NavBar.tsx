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
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const shortName = user?.firstName + " " + user?.lastName.charAt(0) + ".";


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }

    function handleResize() {
      if (window.innerWidth >= 640 && isMenuOpen) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/10 backdrop-blur-md py-4 border-b border-white/10">
      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8">
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
          <nav className="hidden space-x-8 sm:flex items-center">
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
              className="text-sm text-gray-300 hover:text-white transition-colors hidden md:block"
            >
              Ediciones Pasadas
            </Link>
            <Link
              to="/contribuidores"
              className="text-sm text-gray-300 hover:text-white transition-colors hidden min-[880px]:block"
            >
              Contribuidores
            </Link>

            {/* "Más" Dropdown */}
            <div className="relative min-[880px]:hidden" ref={moreDropdownRef}>
              <button
                className={`text-2xl font-light transition-all duration-300 cursor-pointer flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/5 ${moreDropdownOpen ? 'text-[#8c45ff] rotate-45' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                aria-label="Más opciones"
              >
                +
              </button>

              <div
                className={`absolute top-full right-0 mt-4 w-48 rounded-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out bg-[#0d0f14]/80 backdrop-blur-xl border border-white/10 ${moreDropdownOpen ? "opacity-100 translate-y-0 visible" : "opacity-0 -translate-y-2 invisible"
                  }`}
              >
                <div className="flex flex-col space-y-4 p-4">
                  <Link
                    to="/ediciones-pasadas"
                    className="text-sm text-gray-300 hover:text-white transition-colors md:hidden block"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Ediciones Pasadas
                  </Link>
                  <Link
                    to="/contribuidores"
                    className="text-sm text-gray-300 hover:text-white transition-colors block"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Contribuidores
                  </Link>
                </div>
              </div>
            </div>
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
                      className="cursor-pointer block px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Mi dashboard
                    </Link>
                    <button
                      className="cursor-pointer w-full text-left px-4 py-2 text-sm text-red-300 hover:bg-white/10 transition"
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
              className="ml-4 text-white sm:hidden cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`sm:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
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
              to="/ediciones-pasadas"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Ediciones Pasadas
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
