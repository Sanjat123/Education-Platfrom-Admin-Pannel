import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiYoutube,
  FiMail, FiPhone, FiMapPin, FiChevronRight, FiGlobe,
  FiHeart, FiCreditCard, FiShield, FiAward, FiMessageSquare,
  FiChevronDown, FiChevronUp, FiSmartphone, FiTablet,
  FiCheck, FiSend, FiClock, FiUsers, FiStar
} from "react-icons/fi";
import { 
  FaApple, FaGooglePlay, FaCcVisa, FaCcMastercard, 
  FaCcPaypal, FaCcAmazonPay, FaCcAmex, FaGooglePay,
  FaGoogle, FaApplePay, FaRocket, FaGraduationCap
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    quickLinks: false,
    categories: false,
    company: false
  });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success("🎉 Successfully subscribed to newsletter!");
      setEmail("");
      setLoading(false);
    }, 1000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const quickLinks = [
    { text: "Home", to: "/" },
    { text: "All Courses", to: "/courses" },
    { text: "Categories", to: "/categories" },
    { text: "Become Instructor", to: "/instructor/apply" },
    { text: "About Us", to: "/about" },
    { text: "Contact Us", to: "/contact" },
    { text: "Blog", to: "/blog" },
    { text: "FAQs", to: "/faq" }
  ];

  const categories = [
    { text: "Web Development", count: "1,250", icon: "💻" },
    { text: "Data Science", count: "850", icon: "📊" },
    { text: "Digital Marketing", count: "620", icon: "📈" },
    { text: "UI/UX Design", count: "540", icon: "🎨" },
    { text: "Business", count: "480", icon: "💼" },
    { text: "Photography", count: "320", icon: "📷" },
    { text: "Music", count: "280", icon: "🎵" },
    { text: "Health & Fitness", count: "410", icon: "💪" }
  ];

  const companyLinks = [
    { text: "Careers", to: "/careers" },
    { text: "Press", to: "/press" },
    { text: "Partners", to: "/partners" },
    { text: "Affiliate Program", to: "/affiliate" },
    { text: "Investors", to: "/investors" },
    { text: "Team", to: "/team" }
  ];

  const supportLinks = [
    { text: "Help Center", to: "/help" },
    { text: "Community", to: "/community" },
    { text: "Forum", to: "/forum" },
    { text: "Tutorials", to: "/tutorials" },
    { text: "Resources", to: "/resources" },
    { text: "Contact Support", to: "/support" }
  ];

  const legalLinks = [
    { text: "Privacy Policy", to: "/privacy" },
    { text: "Terms of Service", to: "/terms" },
    { text: "Cookie Policy", to: "/cookies" },
    { text: "Refund Policy", to: "/refund" },
    { text: "Accessibility", to: "/accessibility" },
    { text: "Sitemap", to: "/sitemap" }
  ];

  const socialLinks = [
    { icon: <FiFacebook />, label: "Facebook", url: "https://facebook.com/learnify" },
    { icon: <FiTwitter />, label: "Twitter", url: "https://twitter.com/learnify" },
    { icon: <FiInstagram />, label: "Instagram", url: "https://instagram.com/learnify" },
    { icon: <FiLinkedin />, label: "LinkedIn", url: "https://linkedin.com/company/learnify" },
    { icon: <FiYoutube />, label: "YouTube", url: "https://youtube.com/learnify" }
  ];

  const paymentMethods = [
    { icon: <FaCcVisa />, name: "Visa" },
    { icon: <FaCcMastercard />, name: "Mastercard" },
    { icon: <FaCcPaypal />, name: "PayPal" },
    { icon: <FaCcAmazonPay />, name: "Amazon Pay" },
    { icon: <FaCcAmex />, name: "American Express" },
    { icon: <FaGooglePay />, name: "Google Pay" },
    { icon: <FaApplePay />, name: "Apple Pay" },
    { icon: <span className="font-bold text-xs">UPI</span>, name: "UPI" }
  ];

  const trustBadges = [
    { icon: <FiAward />, value: "4.9/5.0", label: "Student Rating", color: "text-amber-500" },
    { icon: <FiUsers />, value: "125K+", label: "Active Students", color: "text-blue-500" },
    { icon: <FiCheck />, value: "98%", label: "Success Rate", color: "text-emerald-500" },
    { icon: <FiClock />, value: "24/7", label: "Support", color: "text-purple-500" }
  ];

  const features = [
    { icon: <FiAward />, text: "Certified Courses", desc: "Industry Recognized" },
    { icon: <FiShield />, text: "Secure Learning", desc: "100% Safe & Private" },
    { icon: <FiCreditCard />, text: "Easy Payments", desc: "Multiple Options" },
    { icon: <FiMessageSquare />, text: "24/7 Support", desc: "Always Available" },
    { icon: <FiGlobe />, text: "Global Access", desc: "Learn Anywhere" }
  ];

  return (
    <footer className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Newsletter Banner */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h3 className="text-xl font-bold mb-2">Stay Ahead with Student Nagari</h3>
              <p className="text-red-100">Get weekly updates on new courses, tips & exclusive offers</p>
            </div>
            
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <FiMail className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60" />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-red-600 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    Subscribing...
                  </>
                ) : (
                  <>
                    <FiSend /> Subscribe
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2 xl:col-span-2">
            <div className="mb-8">
              <Link to="/" className="flex items-center gap-3 mb-6 group">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-rose-500 rounded-xl flex items-center justify-center font-black text-2xl shadow-lg">
                    SN
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute -inset-1 border-2 border-red-500/30 rounded-xl"
                  ></motion.div>
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Student Nagari</h2>
                  <p className="text-sm text-slate-400">Premium Learning Platform</p>
                </div>
              </Link>
              
              <p className="text-slate-300 mb-6 leading-relaxed">
                Transforming lives through education. Join 125,000+ students learning in-demand skills 
                from industry experts worldwide. Your success journey starts here.
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3 mb-8">
                {socialLinks.map((social, idx) => (
                  <motion.a
                    key={idx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -3, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 bg-slate-800 hover:bg-red-600 rounded-lg flex items-center justify-center text-lg transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>

              {/* App Downloads */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-400 mb-2">Download Our App</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.a
                    href="#"
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-xl transition-colors group"
                  >
                    <FaApple className="text-2xl" />
                    <div className="text-left">
                      <p className="text-xs text-slate-400">Download on the</p>
                      <p className="font-bold">App Store</p>
                    </div>
                  </motion.a>
                  <motion.a
                    href="#"
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 px-4 py-3 rounded-xl transition-colors group"
                  >
                    <FaGooglePlay className="text-2xl" />
                    <div className="text-left">
                      <p className="text-xs text-slate-400">Get it on</p>
                      <p className="font-bold">Google Play</p>
                    </div>
                  </motion.a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Accordion Sections */}
          <div className="lg:hidden space-y-4">
            {/* Quick Links Mobile */}
            <div className="bg-slate-800/30 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('quickLinks')}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <span className="font-bold">Quick Links</span>
                {expandedSections.quickLinks ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              <AnimatePresence>
                {expandedSections.quickLinks && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                      {quickLinks.map((link, idx) => (
                        <Link
                          key={idx}
                          to={link.to}
                          className="text-slate-300 hover:text-red-400 transition-colors text-sm py-1"
                        >
                          {link.text}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Categories Mobile */}
            <div className="bg-slate-800/30 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection('categories')}
                className="w-full px-4 py-3 flex items-center justify-between text-left"
              >
                <span className="font-bold">Categories</span>
                {expandedSections.categories ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              <AnimatePresence>
                {expandedSections.categories && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2">
                      {categories.map((category, idx) => (
                        <Link
                          key={idx}
                          to={`/category/${category.text.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                          className="flex items-center justify-between text-slate-300 hover:text-red-400 transition-colors text-sm py-1"
                        >
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            {category.text}
                          </span>
                          <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">
                            {category.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Desktop Columns (hidden on mobile) */}
          <div className="hidden lg:block">
            <h3 className="text-lg font-bold mb-6 pb-2 border-b border-slate-700">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.to}
                    className="text-slate-300 hover:text-red-400 transition-colors flex items-center gap-2 group"
                  >
                    <FiChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500" size={12} />
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <h3 className="text-lg font-bold mb-6 pb-2 border-b border-slate-700">Categories</h3>
            <ul className="space-y-3">
              {categories.map((category, idx) => (
                <li key={idx}>
                  <Link
                    to={`/category/${category.text.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                    className="text-slate-300 hover:text-red-400 transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.text}
                    </span>
                    <span className="text-xs bg-slate-800 group-hover:bg-red-600 px-2 py-1 rounded-full transition-colors">
                      {category.count}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold mb-6 pb-2 border-b border-slate-700">Contact Us</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <FiMail className="text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-400">Email</p>
                  <a 
                    href="mailto:support@studentnagari.com" 
                    className="hover:text-red-400 transition-colors"
                  >
                    support@studentnagari.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FiPhone className="text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-400">Phone</p>
                  <a 
                    href="tel:+919876543210" 
                    className="hover:text-red-400 transition-colors"
                  >
                    +91 99999 99999
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FiMapPin className="text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-slate-400">Address</p>
                  <p className="text-slate-300">123 Baheri<br />Darbhanga, IN </p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-slate-800/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <FiClock className="text-emerald-500" />
                <span className="font-bold text-sm">Business Hours</span>
              </div>
              <p className="text-sm text-slate-400">Mon - Fri: 9:00 AM - 8:00 PM</p>
              <p className="text-sm text-slate-400">Sat - Sun: 10:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -5 }}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
              >
                <div className="text-2xl text-red-500 mb-2">{feature.icon}</div>
                <h4 className="font-bold text-sm mb-1">{feature.text}</h4>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustBadges.map((badge, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 flex items-center gap-4 border border-slate-700"
            >
              <div className={`text-2xl ${badge.color}`}>{badge.icon}</div>
              <div>
                <p className="text-2xl font-bold">{badge.value}</p>
                <p className="text-xs text-slate-400">{badge.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-center md:text-left">
              <p className="text-slate-400 text-sm">
                © {currentYear} Student Nagari Education Pvt. Ltd. All rights reserved.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Made with <FiHeart className="inline text-red-500 animate-pulse" /> Sanjat Kumar
              </p>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col items-center md:items-end">
              <p className="text-sm text-slate-400 mb-2">Accepted Payment Methods</p>
              <div className="flex flex-wrap justify-center gap-2">
                {paymentMethods.map((method, idx) => (
                  <div
                    key={idx}
                    className="w-10 h-8 bg-slate-800 rounded flex items-center justify-center text-lg hover:bg-slate-700 transition-colors"
                    title={method.name}
                  >
                    {method.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legal Links */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {legalLinks.map((link, idx) => (
                <Link
                  key={idx}
                  to={link.to}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  {link.text}
                </Link>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <FiSmartphone />
              <span>Mobile Optimized</span>
            </div>
            <div className="flex items-center gap-2">
              <FiTablet />
              <span>Tablet Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <FaGoogle />
              <span>SEO Friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <FaRocket />
              <span>Fast Loading</span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <motion.button
        onClick={scrollToTop}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-br from-red-600 to-rose-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-red-500/30 transition-all"
        aria-label="Back to top"
      >
        <FiChevronUp className="text-xl" />
      </motion.button>

      {/* Live Support Chat */}
      <motion.button
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1, rotate: 10 }}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-blue-500/30 transition-all group"
        aria-label="Live Support"
        onClick={() => toast.success("💬 Live chat opening soon!")}
      >
        <FiMessageSquare className="text-xl" />
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-red-500 rounded-full"></span>
      </motion.button>
    </footer>
  );
};

export default Footer;