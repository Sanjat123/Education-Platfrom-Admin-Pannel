// components/ManualPaymentModal.jsx
import React, { useState } from 'react';
import { FiUpload, FiX, FiAlertCircle, FiCopy, FiImage } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const ManualPaymentModal = ({ course, onClose, onSubmit, user, userProfile }) => {
  const [transactionId, setTransactionId] = useState('');
  const [bankName, setBankName] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size should be less than 5MB');
      return;
    }

    setUploading(true);

    // In production, upload to Firebase Storage or your server
    // For demo, we'll create a mock URL
    setTimeout(() => {
      const mockUrl = URL.createObjectURL(file);
      setUploadedUrl(mockUrl);
      setScreenshot(file);
      setUploading(false);
      toast.success('Screenshot uploaded successfully');
    }, 1500);
  };

  const handleSubmit = () => {
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    // Prepare data
    const screenshotData = {
      url: uploadedUrl,
      fileName: screenshot.name,
      transactionId,
      bankName,
      notes
    };

    onSubmit(screenshotData);
  };

  const copyBankDetails = () => {
    const details = `Account Name: Learning Platform\nAccount Number: 123456789012\nIFSC Code: SBIN0001234\nBank: State Bank of India\nUPI ID: learningplatform@upi`;
    
    navigator.clipboard.writeText(details);
    toast.success('Bank details copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Manual Payment Process</h2>
            <p className="text-slate-600">Upload payment proof for manual verification</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Payment Details */}
            <div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FaRupeeSign /> Payment Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-red-200">
                    <span className="text-slate-600">Course:</span>
                    <span className="font-bold">{course.title}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-3 border-b border-red-200">
                    <span className="text-slate-600">Amount to Pay:</span>
                    <span className="text-2xl font-bold text-red-600">
                      ₹{course.discountPrice || course.price}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Student:</span>
                    <span className="font-bold">{userProfile?.name || user.email}</span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Bank Transfer Details</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Account Name:</span>
                    <span className="font-bold">Learning Platform</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Account Number:</span>
                    <span className="font-bold">123456789012</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">IFSC Code:</span>
                    <span className="font-bold">SBIN0001234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bank:</span>
                    <span className="font-bold">State Bank of India</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">UPI ID:</span>
                    <span className="font-bold">learningplatform@upi</span>
                  </div>
                </div>

                <button
                  onClick={copyBankDetails}
                  className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <FiCopy /> Copy Bank Details
                </button>
              </div>

              {/* Payment Methods */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6">
                <h4 className="font-bold text-slate-800 mb-3">Payment Methods Accepted</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">Bank Transfer (NEFT/IMPS)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">UPI Payment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">Google Pay / PhonePe</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-700">Paytm Wallet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Upload Form */}
            <div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <FiUpload /> Upload Payment Proof
                </h3>

                {/* Upload Area */}
                <div className="mb-6">
                  <label className="block text-slate-700 font-medium mb-3">
                    Payment Screenshot / Receipt *
                  </label>
                  
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      id="screenshot-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    
                    <label htmlFor="screenshot-upload" className="cursor-pointer">
                      {uploading ? (
                        <div className="space-y-4">
                          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full mx-auto animate-spin"></div>
                          <p className="text-slate-600">Uploading...</p>
                        </div>
                      ) : screenshot ? (
                        <div className="space-y-4">
                          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                            <FiImage className="text-emerald-600 text-3xl" />
                          </div>
                          <p className="font-bold text-emerald-600">{screenshot.name}</p>
                          <p className="text-sm text-slate-500">Click to change file</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                            <FiUpload className="text-slate-400 text-3xl" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">Click to upload screenshot</p>
                            <p className="text-sm text-slate-500">JPG, PNG up to 5MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  
                  {uploadedUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-600 mb-2">Preview:</p>
                      <img 
                        src={uploadedUrl} 
                        alt="Payment proof" 
                        className="max-h-48 rounded-lg border border-slate-200"
                      />
                    </div>
                  )}
                </div>

                {/* Transaction Details */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-slate-700 font-medium mb-2">
                      Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., TXN123456789"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-2">
                      Bank Name / Payment App (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., SBI, Google Pay, PhonePe"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Any additional information for verification..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 h-32 resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3 mb-4">
                  <FiAlertCircle className="text-amber-600 text-xl mt-1" />
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">Important Instructions</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        Ensure screenshot clearly shows transaction ID and amount
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        Include your email ID in payment notes if possible
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        Verification usually takes 2-24 hours during business days
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        You'll receive email notification once approved
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!screenshot}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold transition-colors ${
                    screenshot 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Submit for Verification
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-slate-200 text-center">
                <p className="text-sm text-slate-600 mb-2">Need immediate assistance?</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("support@learningplatform.com");
                      toast.success("Support email copied!");
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-bold"
                  >
                    ✉️ support@learningplatform.com
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("+91 9876543210");
                      toast.success("Phone number copied!");
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-bold"
                  >
                    📞 +91 9876543210
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ManualPaymentModal;