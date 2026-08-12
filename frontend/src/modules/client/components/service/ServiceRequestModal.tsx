import React, { useState } from 'react';
import type { RequestType } from '../../types';
import { Bell, CreditCard, X, CheckCircle2 } from 'lucide-react';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequest: (type: RequestType) => void;
  tableName: string;
}

export const ServiceRequestModal: React.FC<ServiceRequestModalProps> = ({
  isOpen,
  onClose,
  onRequest,
  tableName,
}) => {
  if (!isOpen) return null;

  const [submittedType, setSubmittedType] = useState<RequestType | null>(null);

  const handleSelect = (type: RequestType) => {
    onRequest(type);
    setSubmittedType(type);
    setTimeout(() => {
      setSubmittedType(null);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 animate-slide-up relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submittedType ? (
          <div className="py-8 text-center flex flex-col items-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-headline font-bold text-lg text-gray-900">Đã gửi yêu cầu!</h3>
            <p className="text-xs text-gray-500 font-body max-w-xs">
              Nhân viên phục vụ đã nhận được thông báo từ <span className="font-bold text-gray-800">{tableName}</span> và đang đến hỗ trợ.
            </p>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="font-headline font-bold text-xl text-gray-900">Hỗ trợ tại bàn</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">{tableName}</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSelect('CALL_STAFF')}
                className="w-full p-4 bg-orange-50/80 hover:bg-orange-100 border border-orange-200/80 rounded-2xl flex items-center gap-3.5 transition-all active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                  <Bell className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-headline font-bold text-base text-gray-900">Gọi nhân viên phục vụ</p>
                  <p className="text-xs text-gray-500 mt-0.5">Cần hỗ trợ thông tin hoặc gọi món thêm</p>
                </div>
              </button>

              <button
                onClick={() => handleSelect('REQUEST_PAYMENT')}
                className="w-full p-4 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 rounded-2xl flex items-center gap-3.5 transition-all active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-headline font-bold text-base text-gray-900">Yêu cầu tính tiền</p>
                  <p className="text-xs text-gray-500 mt-0.5">Thanh toán tiền mặt hoặc VietQR PayOS</p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
