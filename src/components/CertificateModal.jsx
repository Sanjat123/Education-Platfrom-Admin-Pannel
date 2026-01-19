import React, { useRef } from "react";
import { motion } from "framer-motion";
import { 
  FiDownload, 
  FiX, 
  FiCheckCircle, 
  FiCalendar, 
  FiHash, 
  FiShare2,
  FiPrinter,
  FiCopy
} from "react-icons/fi";
import { FaCertificate, FaGraduationCap } from "react-icons/fa";
import toast from "react-hot-toast";

const CertificateModal = ({ certificate, onClose, onDownload }) => {
  const certificateRef = useRef();

  const handleDownload = () => {
    // In production, generate PDF certificate
    toast.success("Certificate downloaded successfully!");
    if (onDownload) onDownload();
  };

  const handleShare = () => {
    const shareText = `I earned a certificate in "${certificate.courseTitle}" from Student Nagari! 🎓\n\nCertificate ID: ${certificate.certificateId}\n\nView certificate: https://studentnagari.com/certificate/${certificate.certificateId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Certificate: ${certificate.courseTitle}`,
        text: shareText,
        url: `https://studentnagari.com/certificate/${certificate.certificateId}`
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Certificate link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const copyCertificateId = () => {
    navigator.clipboard.writeText(certificate.certificateId);
    toast.success("Certificate ID copied!");
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <FaCertificate className="text-amber-600 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Certificate of Completion</h2>
              <p className="text-slate-600">Digital Credential Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Certificate Preview */}
            <div 
              ref={certificateRef}
              className="border-8 border-amber-400 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-50 to-white shadow-lg mb-8 relative"
            >
              {/* Certificate Design */}
              <div className="p-8 md:p-12">
                {/* Header Decoration */}
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
                        <FaGraduationCap className="text-white text-3xl" />
                      </div>
                      <div className="absolute -inset-4 border-4 border-amber-200 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-2">
                      STUDENT NAGARI
                    </h1>
                    <p className="text-amber-700 text-lg">Official Learning Platform</p>
                  </div>
                </div>

                {/* Certificate Body */}
                <div className="text-center py-8 border-t border-b border-amber-200">
                  <p className="text-slate-600 mb-6 text-lg">This certificate is proudly presented to</p>
                  
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                    {certificate.studentName}
                  </h2>
                  
                  <p className="text-slate-600 text-lg mb-8">
                    for successfully completing the course
                  </p>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-red-600 mb-8">
                    {certificate.courseTitle}
                  </h3>
                  
                  <div className="flex items-center justify-center gap-8 text-slate-600">
                    <div className="flex items-center gap-2">
                      <FiCalendar />
                      <span>{certificate.completionDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiHash />
                      <span className="font-mono">{certificate.certificateId}</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="h-20 flex items-center justify-center">
                      <div className="w-16 h-1 bg-amber-400"></div>
                    </div>
                    <p className="text-sm text-slate-600">Director of Education</p>
                    <p className="font-bold text-slate-800">Dr. Ramesh Sharma</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-20 flex items-center justify-center">
                      <FiCheckCircle className="text-emerald-500 text-4xl" />
                    </div>
                    <p className="text-sm text-slate-600">Verified Online Credential</p>
                    <p className="font-bold text-slate-800">https://studentnagari.com</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-20 flex items-center justify-center">
                      <div className="w-16 h-1 bg-amber-400"></div>
                    </div>
                    <p className="text-sm text-slate-600">Platform Director</p>
                    <p className="font-bold text-slate-800">Prof. Anjali Verma</p>
                  </div>
                </div>
              </div>

              {/* Watermark Background - Simplified */}
              <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
                <div className="absolute inset-0 bg-repeat" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px'
                }}></div>
              </div>
            </div>

            {/* Certificate Info & Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Certificate Details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FiCheckCircle className="text-emerald-500" /> Certificate Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Certificate ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{certificate.certificateId}</span>
                        <button
                          onClick={copyCertificateId}
                          className="p-1 hover:bg-slate-200 rounded"
                          title="Copy Certificate ID"
                        >
                          <FiCopy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Issued Date:</span>
                      <span className="font-bold">{new Date(certificate.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Credential Type:</span>
                      <span className="font-bold">Digital Certificate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Verification URL:</span>
                      <span className="font-bold text-blue-600">studentnagari.com/verify</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Expiry Date:</span>
                      <span className="font-bold">Lifetime Access</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Verification Instructions</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Share your certificate ID for verification</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Employers can verify at studentnagari.com/verify</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Add to LinkedIn under Licenses & Certifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <span>Include in your resume and portfolio</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleDownload}
                      className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiDownload /> Download PDF
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiShare2 /> Share Certificate
                    </button>
                    <button
                      onClick={handlePrint}
                      className="w-full border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <FiPrinter /> Print Certificate
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Add to Profile</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors">
                      Add to LinkedIn
                    </button>
                    <button className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors">
                      Add to GitHub
                    </button>
                    <button className="w-full border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50">
                      Add to Resume
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Section */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Verify This Certificate</h3>
                  <p className="text-slate-300">
                    Use the certificate ID to verify authenticity online
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="font-mono font-bold text-lg">{certificate.certificateId}</div>
                    <div className="text-xs text-slate-300 mt-1">Certificate ID</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://studentnagari.com/verify/${certificate.certificateId}`);
                      toast.success("Verification link copied!");
                    }}
                    className="bg-white text-slate-900 py-3 px-6 rounded-xl font-bold hover:bg-slate-100 transition-colors whitespace-nowrap"
                  >
                    Copy Verification Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex justify-between items-center">
          <p className="text-sm text-slate-500">
            This certificate verifies the successful completion of the course by the student.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CertificateModal;