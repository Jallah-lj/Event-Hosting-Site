import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Lock, Smartphone, CreditCard, CheckCircle, X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  currency: string;
  eventName: string;
  ticketName: string;
  quantity: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, onClose, onSuccess, amount, currency, eventName, ticketName, quantity 
}) => {
  const [step, setStep] = useState<'METHOD' | 'PROCESSING' | 'SUCCESS'>('METHOD');
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE_MONEY' | 'CARD'>('MOBILE_MONEY');
  const [provider, setProvider] = useState<'MTN' | 'ORANGE'>('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('METHOD');
      setPhoneNumber('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('PROCESSING');
    
    // Simulate API call / USSD push
    setTimeout(() => {
      setStep('SUCCESS');
      setTimeout(() => {
        onSuccess();
      }, 1500);
    }, 3000);
  };

  const renderMethodStep = () => (
    <div className="space-y-6">
      <div className="flex justify-center space-x-4 mb-6">
        <button
          type="button"
          onClick={() => setPaymentMethod('MOBILE_MONEY')}
          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all w-36 ${
            paymentMethod === 'MOBILE_MONEY' 
              ? 'border-liberia-blue bg-blue-50 text-liberia-blue shadow-sm' 
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Smartphone className="w-8 h-8 mb-2" />
          <span className="font-bold text-sm">Mobile Money</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod('CARD')}
          className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all w-36 ${
            paymentMethod === 'CARD' 
              ? 'border-liberia-blue bg-blue-50 text-liberia-blue shadow-sm' 
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <CreditCard className="w-8 h-8 mb-2" />
          <span className="font-bold text-sm">Card</span>
        </button>
      </div>

      {paymentMethod === 'MOBILE_MONEY' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setProvider('MTN')}
                className={`p-3 rounded-lg border flex items-center justify-center font-bold transition-all ${
                  provider === 'MTN' 
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-700 ring-2 ring-yellow-400' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-yellow-400 mr-2 border border-yellow-500"></div>
                MTN MoMo
              </button>
              <button
                type="button"
                onClick={() => setProvider('ORANGE')}
                className={`p-3 rounded-lg border flex items-center justify-center font-bold transition-all ${
                  provider === 'ORANGE' 
                    ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-500' 
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2 border border-orange-600"></div>
                Orange Money
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none border-r border-gray-300 pr-2">
                <span className="text-gray-500 font-medium text-sm">LR (+231)</span>
              </div>
              <input
                type="tel"
                required
                placeholder={provider === 'MTN' ? "088 000 0000" : "077 000 0000"}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-24 block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2.5 border"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center">
               <Smartphone className="w-3 h-3 mr-1" />
               You will receive a USSD prompt on this number to approve.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
            <input
              type="text"
              placeholder="0000 0000 0000 0000"
              className="block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 px-3 border"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input type="text" placeholder="MM/YY" className="block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 px-3 border" value={expiry} onChange={e => setExpiry(e.target.value)} />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input type="text" placeholder="123" className="block w-full border-gray-300 rounded-md focus:ring-liberia-blue focus:border-liberia-blue shadow-sm py-2 px-3 border" value={cvc} onChange={e => setCvc(e.target.value)} />
             </div>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-gray-100 mt-6">
        <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg">
          <span className="text-gray-600 font-medium">Total to pay</span>
          <span className="text-2xl font-bold text-gray-900">{currency === 'LRD' ? 'L$' : '$'}{amount.toLocaleString()}</span>
        </div>
        <Button 
          type="submit" 
          className={`w-full justify-center py-3 text-lg shadow-lg transition-colors ${
             paymentMethod === 'MOBILE_MONEY' && provider === 'MTN' ? 'hover:bg-yellow-600' :
             paymentMethod === 'MOBILE_MONEY' && provider === 'ORANGE' ? 'hover:bg-orange-600' : ''
          }`} 
          disabled={paymentMethod === 'MOBILE_MONEY' && phoneNumber.length < 5}
        >
          <Lock className="w-4 h-4 mr-2" />
          Pay Now
        </Button>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-liberia-blue rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-8 h-8 text-liberia-blue opacity-50" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Processing Payment</h3>
      {paymentMethod === 'MOBILE_MONEY' ? (
        <div className="text-center text-gray-600 max-w-xs space-y-2">
          <p>Request sent to <span className="font-bold text-gray-900">{phoneNumber}</span></p>
          <div className="bg-yellow-50 text-yellow-800 text-sm p-3 rounded-lg border border-yellow-200">
             Please check your phone and enter your PIN to confirm the transaction.
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">Contacting your bank...</p>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="flex flex-col items-center justify-center py-8 animate-in zoom-in">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <CheckCircle className="w-12 h-12" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
      <p className="text-gray-500">Your ticket has been booked.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-gray-200">
          <div className="bg-liberia-blue px-4 py-4 sm:px-6 flex justify-between items-center pattern-bg relative overflow-hidden">
            <div className="absolute inset-0 bg-liberia-red opacity-10 mix-blend-overlay"></div>
            <h3 className="text-lg leading-6 font-medium text-white flex items-center relative z-10">
              <Lock className="w-4 h-4 mr-2" />
              Secure Checkout
            </h3>
            <button onClick={onClose} className="text-white/80 hover:text-white focus:outline-none relative z-10 hover:bg-white/10 rounded-full p-1 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
             {step === 'METHOD' && (
               <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Item</p>
                      <p className="font-bold text-gray-900 text-lg">{quantity}x {ticketName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{eventName}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Amount</p>
                      <p className="font-bold text-liberia-blue text-lg">{currency === 'LRD' ? 'L$' : '$'}{amount.toLocaleString()}</p>
                  </div>
               </div>
             )}

             <form onSubmit={handleSubmit}>
              {step === 'METHOD' && renderMethodStep()}
              {step === 'PROCESSING' && renderProcessingStep()}
              {step === 'SUCCESS' && renderSuccessStep()}
             </form>
          </div>
        </div>
      </div>
    </div>
  );
};