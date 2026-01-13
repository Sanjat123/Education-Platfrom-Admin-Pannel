import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiX, 
  FiCreditCard, 
  FiSmartphone, 
  FiShield, 
  FiCheckCircle,
  FiLock
} from "react-icons/fi";
import { FaGooglePay, FaPhone } from "react-icons/fa";
import { SiRazorpay, SiPaytm } from "react-icons/si";
import toast from "react-hot-toast";

const PaymentModal = ({ course, onClose, onSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Select method, 2: Payment details, 3: Success

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, integrate with Razorpay/Stripe
      // const razorpay = new window.Razorpay(options);
      // razorpay.open();
      
      const mockPaymentData = {
        paymentId: `pay_${Date.now()}`,
        orderId: `order_${Date.now()}`,
        amount: course.discountPrice || course.price,
        method: paymentMethod
      };
      
      setStep(3);
      setTimeout(() => {
        onSuccess(mockPaymentData);
        onClose();
      }, 2000);
      
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white sticky top-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Complete Enrollment</h2>
              <button onClick={onClose} className="text-white hover:text-red-200">
                <FiX size={24} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <img 
                src={course.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085"} 
                alt={course.title}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div>
                <h3 className="font-bold">{course.title}</h3>
                <p className="text-red-100">By {course.teacherName || "Instructor"}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {/* Order Summary */}
                <div className="bg-slate-50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-slate-800 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Course Price</span>
                      <span className="font-bold">₹{course.price || 0}</span>
                    </div>
                    {course.discountPrice && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Discount</span>
                        <span className="text-emerald-600 font-bold">
                          -₹{course.price - course.discountPrice}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-600">Platform Fee</span>
                      <span className="text-slate-600">₹0</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-bold text-lg">Total Amount</span>
                        <span className="font-bold text-2xl text-red-600">
                          ₹{course.discountPrice || course.price || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <h3 className="font-bold text-slate-800 mb-4">Select Payment Method</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  <button
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                      paymentMethod === "razorpay" 
                        ? "border-red-600 bg-red-50" 
                        : "border-slate-200 hover:border-red-300"
                    }`}
                  >
                    <SiRazorpay className="text-2xl text-red-600" />
                    <span className="text-sm font-medium">Razorpay</span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod("googlepay")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                      paymentMethod === "googlepay" 
                        ? "border-red-600 bg-red-50" 
                        : "border-slate-200 hover:border-red-300"
                    }`}
                  >
                    <FaGooglePay className="text-2xl text-slate-800" />
                    <span className="text-sm font-medium">Google Pay</span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod("paytm")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                      paymentMethod === "paytm" 
                        ? "border-red-600 bg-red-50" 
                        : "border-slate-200 hover:border-red-300"
                    }`}
                  >
                    <SiPaytm className="text-2xl text-blue-600" />
                    <span className="text-sm font-medium">Paytm</span>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${
                      paymentMethod === "card" 
                        ? "border-red-600 bg-red-50" 
                        : "border-slate-200 hover:border-red-300"
                    }`}
                  >
                    <FiCreditCard className="text-2xl text-slate-700" />
                    <span className="text-sm font-medium">Card</span>
                  </button>
                </div>

                {/* Security Info */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FiShield className="text-emerald-600 mt-1" />
                    <div>
                      <p className="font-medium text-emerald-800">Secure Payment</p>
                      <p className="text-sm text-emerald-600">
                        Your payment is secured with 256-bit SSL encryption. We never store your card details.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50"
                  >
                    Continue to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="font-bold text-slate-800 mb-6">Payment Details</h3>
                
                {paymentMethod === "razorpay" && (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <SiRazorpay className="text-5xl text-red-600" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">Redirecting to Razorpay</h4>
                    <p className="text-slate-600 mb-8">
                      You will be redirected to Razorpay's secure payment page to complete your purchase.
                    </p>
                  </div>
                )}
                
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 border border-slate-300 rounded-xl font-bold hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiLock /> Pay ₹{course.discountPrice || course.price || 0}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiCheckCircle className="text-5xl text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  Payment Successful! 🎉
                </h3>
                <p className="text-slate-600 mb-8">
                  You are now enrolled in <span className="font-bold">{course.title}</span>. 
                  Redirecting to course...
                </p>
                <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;