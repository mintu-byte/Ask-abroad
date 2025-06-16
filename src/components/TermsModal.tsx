import React from 'react';
import { X, FileText, Check } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  userType?: 'signup' | 'google';
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept, userType = 'signup' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-6 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm"></div>
                  <div className="relative bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Terms and Conditions
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Please read and accept our terms to continue
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">AskAbroad Terms of Service</h4>
              
              <div className="space-y-4 text-gray-700">
                <section>
                  <h5 className="font-medium text-gray-900 mb-2">1. Acceptance of Terms</h5>
                  <p className="text-sm leading-relaxed">
                    By accessing and using AskAbroad, you accept and agree to be bound by the terms and provision of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h5 className="font-medium text-gray-900 mb-2">2. Use License</h5>
                  <p className="text-sm leading-relaxed">
                    Permission is granted to temporarily use AskAbroad for personal, non-commercial transitory viewing only. 
                    This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>modify or copy the materials</li>
                    <li>use the materials for any commercial purpose or for any public display</li>
                    <li>attempt to reverse engineer any software contained on the website</li>
                    <li>remove any copyright or other proprietary notations from the materials</li>
                  </ul>
                </section>

                <section>
                  <h5 className="font-medium text-gray-900 mb-2">3. Chat Room Guidelines</h5>
                  <p className="text-sm leading-relaxed">
                    Users must maintain respectful communication in all chat rooms. Harassment, spam, or inappropriate content 
                    will result in immediate account suspension. All conversations are monitored for quality and safety.
                  </p>
                </section>

                <section>
                  <h5 className="font-medium text-gray-900 mb-2">4. Privacy Policy</h5>
                  <p className="text-sm leading-relaxed">
                    Your privacy is important to us. We collect and use your information only as described in our Privacy Policy. 
                    By using our service, you consent to the collection and use of information in accordance with our policy.
                  </p>
                </section>

                <section>
                  <h5 className="font-medium text-gray-900 mb-2">5. Expert Advice Disclaimer</h5>
                  <p className="text-sm leading-relaxed">
                    While our Industry Experts are qualified professionals, the advice provided is for informational purposes only. 
                    Users should verify all information and consult with official sources before making important decisions.
                  </p>
                </section>

                <section>
                  <h5 className="font-medium text-gray-900 mb-2">6. Account Termination</h5>
                  <p className="text-sm leading-relaxed">
                    We reserve the right to terminate accounts that violate our terms of service or engage in inappropriate behavior. 
                    Users may also delete their accounts at any time through their profile settings.
                  </p>
                </section>

                <section>
                  <h5 className="font-medium text-gray-900 mb-2">7. Limitation of Liability</h5>
                  <p className="text-sm leading-relaxed">
                    AskAbroad shall not be liable for any damages arising from the use or inability to use our service, 
                    including but not limited to direct, indirect, incidental, punitive, and consequential damages.
                  </p>
                </section>

                <section>
                  <h5 className="font-medium text-gray-900 mb-2">8. Changes to Terms</h5>
                  <p className="text-sm leading-relaxed">
                    We reserve the right to modify these terms at any time. Users will be notified of significant changes 
                    and continued use of the service constitutes acceptance of the modified terms.
                  </p>
                </section>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
              <p className="text-sm text-gray-600">
                {userType === 'google' 
                  ? 'You must accept our terms to continue with Google sign-in'
                  : 'You must accept our terms to create an account'
                }
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={onAccept}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <Check className="h-4 w-4 mr-2" />
                  I Accept Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;