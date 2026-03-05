import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-green-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">online patient</h3>
            <p className="text-white/80">
              Providing quality healthcare services to our community with dedication and compassion.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-white/80 transition-colors duration-200 hover:scale-110 transform">
                <FaFacebook size={24} />
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors duration-200 hover:scale-110 transform">
                <FaTwitter size={24} />
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors duration-200 hover:scale-110 transform">
                <FaInstagram size={24} />
              </a>
              <a href="#" className="text-white hover:text-white/80 transition-colors duration-200 hover:scale-110 transform">
                <FaLinkedin size={24} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-white/80 hover:text-white transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-white/80 hover:text-white transition-colors duration-200">
                  Our Services
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="text-white/80 hover:text-white transition-colors duration-200">
                  Our Doctors
                </Link>
              </li>
              <li>
                <Link to="/appointment" className="text-white/80 hover:text-white transition-colors duration-200">
                  Book Appointment
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2">
              <li className="text-white/80">General Checkup</li>
              <li className="text-white/80">Dental Care</li>
              <li className="text-white/80">Cardiology</li>
              <li className="text-white/80">Pediatrics</li>
              <li className="text-white/80">Laboratory Tests</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <FaPhone className="text-white/80" />
                <span className="text-white/80">+1 234 567 8900</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaEnvelope className="text-white/80" />
                <span className="text-white/80">contact@healthcare.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <FaMapMarkerAlt className="text-white/80" />
                <span className="text-white/80">123 Healthcare Street, City, Country</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/80 text-sm">
              © {new Date().getFullYear()} Healthcare. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-white/80 hover:text-white text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-white/80 hover:text-white text-sm transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
