// src/components/common/Footer.jsx
import React from "react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-6 py-10 mt-20 shadow-inner">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* About Us */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">BoomBoomCars</h4>
          <p className="text-sm leading-relaxed">
            BoomBoomCars is your go-to platform for affordable and luxury car rentals across Indian cities. We make travel seamless, secure, and stylish.
          </p>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Contact Us</h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-500" />
              101, Model Town, Ongole, Andhra Pradesh - 523001
            </li>
            <li className="flex items-center gap-2">
              <FaEnvelope className="text-blue-500" />
              support@boomboomcars.com
            </li>
            <li className="flex items-center gap-2">
              <FaPhoneAlt className="text-blue-500" />
              +91 98765 43210
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="text-lg font-semibold mb-3 text-blue-600 dark:text-blue-400">Follow Us</h4>
          <div className="flex gap-4 text-blue-600 dark:text-blue-400">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-blue-800 transition">
              <FaFacebookF />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="hover:text-blue-500 transition">
              <FaTwitter />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-pink-500 transition">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="mt-10 border-t border-gray-300 dark:border-gray-700 pt-4 text-sm text-center">
        &copy; {new Date().getFullYear()} BoomBoomCars. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
