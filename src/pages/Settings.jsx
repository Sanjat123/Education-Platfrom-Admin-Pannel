import React, { useState, useEffect } from "react";
import { 
  FiSettings, FiSave, FiLock, FiMail, FiBell, 
  FiGlobe, FiCreditCard, FiShield, FiDatabase, 
  FiUsers, FiAlertCircle, FiCheckCircle, FiRefreshCw,
  FiUpload, FiDownload, FiEye, FiEyeOff, FiTrash2,
  FiInfo, FiCpu, FiCloud, FiKey
} from "react-icons/fi";
import { motion } from "framer-motion";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const Settings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    platformName: "Nagari Learning Platform",
    platformDescription: "Premium Online Learning Platform",
    contactEmail: "support@nagarilearning.com",
    contactPhone: "+91 9876543210",
    supportHours: "9:00 AM - 6:00 PM (Mon-Sat)",
    
    // Security Settings
    passwordMinLength: 8,
    requireTwoFactor: false,
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    autoLogout: true,
    
    // Notification Settings
    emailNotifications: true,
    adminAlerts: true,
    paymentNotifications: true,
    enrollmentNotifications: true,
    
    // Payment Settings
    currency: "INR",
    taxPercentage: 18,
    lateFeeAmount: 500,
    paymentDeadlineDays: 7,
    enablePartialPayments: false,
    
    // System Settings
    maintenanceMode: false,
    allowRegistrations: true,
    enableDarkMode: false,
    cacheDuration: 3600, // seconds
    maxFileSize: 50, // MB
    
    // Email Settings
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecure: true,
    fromEmail: "noreply@nagarilearning.com",
    emailSignature: "Nagari Learning Team"
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showPassword, setShowPassword] = useState(false);
  const [smtpPassword, setSmtpPassword] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, "system_settings", "platform_settings"));
      
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
      
      toast.success("Settings loaded successfully");
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Validate settings
      if (settings.passwordMinLength < 6) {
        toast.error("Password minimum length must be at least 6");
        return;
      }
      
      if (settings.taxPercentage < 0 || settings.taxPercentage > 100) {
        toast.error("Tax percentage must be between 0 and 100");
        return;
      }

      // Save to Firestore
      await updateDoc(doc(db, "system_settings", "platform_settings"), settings);
      
      toast.success("Settings saved successfully!");
      
      // Simulate API call
      setTimeout(() => {
        setSaving(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      const defaultSettings = {
        platformName: "Nagari Learning Platform",
        platformDescription: "Premium Online Learning Platform",
        contactEmail: "support@nagarilearning.com",
        contactPhone: "+91 9876543210",
        supportHours: "9:00 AM - 6:00 PM (Mon-Sat)",
        passwordMinLength: 8,
        requireTwoFactor: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        autoLogout: true,
        emailNotifications: true,
        adminAlerts: true,
        paymentNotifications: true,
        enrollmentNotifications: true,
        currency: "INR",
        taxPercentage: 18,
        lateFeeAmount: 500,
        paymentDeadlineDays: 7,
        enablePartialPayments: false,
        maintenanceMode: false,
        allowRegistrations: true,
        enableDarkMode: false,
        cacheDuration: 3600,
        maxFileSize: 50
      };
      
      setSettings(defaultSettings);
      toast.success("Settings reset to defaults");
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: typeof value === 'string' && value.match(/^\d+$/) ? parseInt(value) : value
    }));
  };

  const tabs = [
    { id: "general", label: "General", icon: <FiSettings /> },
    { id: "security", label: "Security", icon: <FiLock /> },
    { id: "notifications", label: "Notifications", icon: <FiBell /> },
    { id: "payment", label: "Payment", icon: <FiCreditCard /> },
    { id: "system", label: "System", icon: <FiCpu /> },
    { id: "email", label: "Email", icon: <FiMail /> },
  ];

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nagari-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("Settings exported successfully");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Platform Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => handleChange("platformName", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Enter platform name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="support@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.contactPhone}
                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="+91 1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Support Hours
                  </label>
                  <input
                    type="text"
                    value={settings.supportHours}
                    onChange={(e) => handleChange("supportHours", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="9:00 AM - 6:00 PM (Mon-Sat)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Platform Description
                  </label>
                  <textarea
                    value={settings.platformDescription}
                    onChange={(e) => handleChange("platformDescription", e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Brief description of your platform"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Platform Features</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Allow New Registrations</h4>
                    <p className="text-sm text-slate-500">Allow new users to sign up</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistrations}
                      onChange={(e) => handleChange("allowRegistrations", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Enable Dark Mode</h4>
                    <p className="text-sm text-slate-500">Allow users to use dark theme</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableDarkMode}
                      onChange={(e) => handleChange("enableDarkMode", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Maintenance Mode</h4>
                    <p className="text-sm text-slate-500">Temporarily disable platform access</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Password Policy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Minimum Password Length
                    <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {settings.passwordMinLength} characters
                    </span>
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleChange("passwordMinLength", e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>6</span>
                    <span>20</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maximum Login Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxLoginAttempts}
                    onChange={(e) => handleChange("maxLoginAttempts", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                  <p className="text-sm text-slate-500 mt-1">Lock account after failed attempts</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleChange("sessionTimeout", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                  <p className="text-sm text-slate-500 mt-1">Auto logout after inactivity</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Security Features</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-slate-500">Require 2FA for admin accounts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireTwoFactor}
                      onChange={(e) => handleChange("requireTwoFactor", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Auto Logout</h4>
                    <p className="text-sm text-slate-500">Logout users after session timeout</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoLogout}
                      onChange={(e) => handleChange("autoLogout", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">IP Whitelisting</h4>
                    <p className="text-sm text-slate-500">Restrict admin access to specific IPs</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Configure IPs
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Activity Logging</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">Enable Detailed Logs</h4>
                  <p className="text-sm text-slate-500">Log all admin activities for auditing</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
                  View Logs
                </button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Email Notifications</h4>
                    <p className="text-sm text-slate-500">Send email notifications for important events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => handleChange("emailNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Admin Alerts</h4>
                    <p className="text-sm text-slate-500">Receive alerts for critical system events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.adminAlerts}
                      onChange={(e) => handleChange("adminAlerts", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Payment Notifications</h4>
                    <p className="text-sm text-slate-500">Notify when payments are received</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentNotifications}
                      onChange={(e) => handleChange("paymentNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Enrollment Notifications</h4>
                    <p className="text-sm text-slate-500">Notify when new enrollments occur</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enrollmentNotifications}
                      onChange={(e) => handleChange("enrollmentNotifications", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Notification Templates</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Welcome Email</h4>
                    <p className="text-sm text-slate-500">Email sent to new users</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Edit Template
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Payment Receipt</h4>
                    <p className="text-sm text-slate-500">Payment confirmation email</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Edit Template
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Password Reset</h4>
                    <p className="text-sm text-slate-500">Password reset instructions</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                    Edit Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settings.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tax Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.taxPercentage}
                    onChange={(e) => handleChange("taxPercentage", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Late Fee Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={settings.lateFeeAmount}
                      onChange={(e) => handleChange("lateFeeAmount", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Payment Deadline (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.paymentDeadlineDays}
                    onChange={(e) => handleChange("paymentDeadlineDays", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Methods</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FiCreditCard className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Credit/Debit Cards</h4>
                      <p className="text-sm text-slate-500">Visa, MasterCard, American Express</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FiGlobe className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">UPI Payments</h4>
                      <p className="text-sm text-slate-500">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FiDatabase className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">Net Banking</h4>
                      <p className="text-sm text-slate-500">All major Indian banks</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Partial Payments</h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-slate-900">Enable Partial Payments</h4>
                  <p className="text-sm text-slate-500">Allow students to pay in installments</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enablePartialPayments}
                    onChange={(e) => handleChange("enablePartialPayments", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case "system":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">System Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cache Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="300"
                    max="86400"
                    value={settings.cacheDuration}
                    onChange={(e) => handleChange("cacheDuration", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                  <p className="text-sm text-slate-500 mt-1">How long to cache data</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxFileSize}
                    onChange={(e) => handleChange("maxFileSize", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  />
                  <p className="text-sm text-slate-500 mt-1">Max upload size for files</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">System Maintenance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Backup Database</h4>
                    <p className="text-sm text-slate-500">Create a backup of all data</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2">
                    <FiDatabase />
                    Backup Now
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Clear Cache</h4>
                    <p className="text-sm text-slate-500">Clear all cached data</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                    <FiRefreshCw />
                    Clear Cache
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">System Logs</h4>
                    <p className="text-sm text-slate-500">View and manage system logs</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                    <FiActivity />
                    View Logs
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-600">Reset All Data</h4>
                    <p className="text-sm text-slate-500">WARNING: This will delete all data</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                    <FiTrash2 />
                    Factory Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">SMTP Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => handleChange("smtpHost", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => handleChange("smtpPort", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={settings.fromEmail}
                    onChange={(e) => handleChange("fromEmail", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="noreply@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent pr-10"
                      placeholder="Enter SMTP password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Signature
                  </label>
                  <textarea
                    value={settings.emailSignature}
                    onChange={(e) => handleChange("emailSignature", e.target.value)}
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Best regards,\nYour Platform Team"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Email Testing</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Test Email Configuration</h4>
                    <p className="text-sm text-slate-500">Send a test email to verify SMTP settings</p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
                    <FiMail />
                    Send Test Email
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-slate-900">Encryption</h4>
                    <p className="text-sm text-slate-500">Use TLS/SSL for secure email transmission</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.smtpSecure}
                      onChange={(e) => handleChange("smtpSecure", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900">
              <FiSettings className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Platform Settings
              </h1>
              <p className="text-slate-600">Configure and manage your platform</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FiRefreshCw />
            Reset Defaults
          </button>
          <button
            onClick={exportSettings}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FiDownload />
            Export
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${
              activeTab === tab.id
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {renderTabContent()}
      </motion.div>

      {/* Status Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm text-slate-700">Settings are saved automatically</span>
          </div>
          <div className="text-sm text-slate-500">
            Last saved: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;