import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DollarSign,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Ban,
  Copy,
  Check,
  Lightbulb,
  AlertCircle,
  Delete,
  RotateCcw
} from 'lucide-react';

export interface OrderItemSummary {
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentAccountInfo {
  bankName: string;
  accountName: string;
  accountNumber: string;
  memo?: string;
}

export interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  totalAmount: number;
  orderItems: OrderItemSummary[];
  orderCode?: string;
  onConfirmCashPayment: (receivedAmount: number) => Promise<void> | void;
  onGenerateQr: () => Promise<void> | void;
  isGeneratingQr?: boolean;
  checkoutUrl?: string;
  qrCodeImageUrl?: string;
  qrPaymentStatus?: 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED';
  onCancelQrPayment: () => void;
  onSimulateQrResult?: (status: 'SUCCESS' | 'FAILED') => void;
  onManualSyncPayment?: () => void;
  countdownSeconds?: number;
  accountInfo?: PaymentAccountInfo;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  tableName,
  totalAmount,
  orderCode = 'ORD-' + Math.floor(1000 + Math.random() * 9000),
  onConfirmCashPayment,
  onGenerateQr,
  isGeneratingQr = false,
  checkoutUrl = '',
  qrCodeImageUrl = '',
  qrPaymentStatus = 'IDLE',
  onCancelQrPayment,
  onSimulateQrResult,
  onManualSyncPayment,
  countdownSeconds,
  accountInfo = {
    bankName: 'Ngân hàng TMCP Quân đội (MBBank)',
    accountName: 'TRAN HUNG TIN',
    accountNumber: '0866739857',
  }
}) => {
  const [paymentMethodTab, setPaymentMethodTab] = useState<'CASH' | 'QR'>('CASH');
  const [cashInputStr, setCashInputStr] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // When modal opens, start with EMPTY cash input (user enters freely)
  useEffect(() => {
    if (isOpen) {
      setCashInputStr('');
      setPaymentMethodTab('CASH');
    }
  }, [isOpen]);

  const formatVND = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  }, []);

  const cashReceivedNum = useMemo(() => {
    if (!cashInputStr) return 0;
    const parsed = parseInt(cashInputStr.replace(/\D/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [cashInputStr]);

  const changeDue = useMemo(() => {
    return Math.max(0, cashReceivedNum - totalAmount);
  }, [cashReceivedNum, totalAmount]);

  const isCashInsufficient = cashReceivedNum < totalAmount;

  // Handle Numpad Actions
  const handleNumpadPress = useCallback((val: string) => {
    setCashInputStr((prev) => {
      const cleanPrev = prev.replace(/\D/g, '');
      if (val === 'CLEAR') return '';
      if (val === 'BACKSPACE') {
        return cleanPrev.slice(0, -1);
      }
      if (cleanPrev === '0' || cleanPrev === '') return val;
      if (cleanPrev.length >= 9) return cleanPrev; // max 999,999,999
      return cleanPrev + val;
    });
  }, []);

  const handlePresetAmount = useCallback((amt: number) => {
    setCashInputStr(amt.toString());
  }, []);

  const handleAddAmount = useCallback((addAmt: number) => {
    setCashInputStr((prev) => {
      const cleanPrev = parseInt(prev.replace(/\D/g, ''), 10) || 0;
      return (cleanPrev + addAmt).toString();
    });
  }, []);

  // Keyboard Navigation (Escape, Enter, Numpad digits)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (paymentMethodTab === 'CASH' && !isCashInsufficient) {
          onConfirmCashPayment(cashReceivedNum);
        }
        return;
      }
      if (paymentMethodTab === 'CASH') {
        if (e.key >= '0' && e.key <= '9') {
          handleNumpadPress(e.key);
        } else if (e.key === 'Backspace') {
          handleNumpadPress('BACKSPACE');
        } else if (e.key === 'Delete') {
          handleNumpadPress('CLEAR');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, paymentMethodTab, isCashInsufficient, cashReceivedNum, onClose, onConfirmCashPayment, handleNumpadPress]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  const transferMemo = accountInfo.memo || orderCode.replace('#', '');

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4 bg-slate-900/50 animate-in fade-in duration-150">
      <div
        className={`bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 transition-all duration-200 w-full flex flex-col max-h-[95vh] ${
          paymentMethodTab === 'QR' && checkoutUrl ? 'max-w-4xl' : 'max-w-xl'
        }`}
      >
        {/* 1. STICKY HEADER */}
        <div className="px-4 py-2.5 md:px-5 md:py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm md:text-base leading-tight">
                Thanh Toán Hóa Đơn - {tableName}
              </h3>
              <p className="text-[11px] text-slate-500">
                Mã đơn: <strong className="font-mono font-semibold text-slate-700">{orderCode}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. BODY CONTAINER - COMPACT FIT WITHOUT SCROLLBARS */}
        <div className="p-3 md:p-4 space-y-2.5 md:space-y-3 overflow-y-auto flex-1">
          {/* TỔNG CẦN THANH TOÁN BAR */}
          <div className="bg-slate-50 px-3.5 py-2 md:py-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">TỔNG CẦN THANH TOÁN:</span>
            <span className="font-extrabold text-lg md:text-xl text-emerald-600">
              {formatVND(totalAmount)}
            </span>
          </div>

          {/* COMPACT SEGMENTED CONTROL TABS */}
          <div className="space-y-2.5">
            <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setPaymentMethodTab('CASH')}
                className={`py-1.5 md:py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethodTab === 'CASH'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Thanh Toán Tiền Mặt</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethodTab('QR')}
                className={`py-1.5 md:py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  paymentMethodTab === 'QR'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4 text-orange-600" />
                <span>Thanh Toán Mã QR</span>
              </button>
            </div>

            {/* TAB 1: THANH TOÁN TIỀN MẶT CÓ NUMPAD POS */}
            {paymentMethodTab === 'CASH' && (
              <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                {/* HIỂN THỊ SỐ TIỀN NHẬN VÀ TIỀN THỪA KHÁCH */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-medium text-slate-600 text-xs mb-1">
                      Số tiền nhận của khách (VND):
                    </label>
                    <input
                      type="text"
                      readOnly
                      placeholder="0 đ"
                      value={cashInputStr ? formatVND(cashReceivedNum) : ''}
                      className="w-full p-2 rounded-xl border border-slate-300 bg-slate-50/50 text-base font-bold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 text-xs mb-1">
                      {isCashInsufficient ? 'Số tiền còn thiếu:' : 'Tiền thừa trả lại khách:'}
                    </label>
                    <div
                      className={`p-2 rounded-xl border font-bold text-base flex items-center justify-between ${
                        isCashInsufficient
                          ? 'border-amber-200 bg-amber-50/60 text-amber-900'
                          : 'border-emerald-200 bg-emerald-50/60 text-emerald-700'
                      }`}
                    >
                      <span>
                        {isCashInsufficient
                          ? formatVND(totalAmount - cashReceivedNum)
                          : formatVND(changeDue)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* HÀNG NÚT GỢI Ý TIỀN CHẴN TRẢ NHANH */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-slate-400">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(totalAmount)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer border border-emerald-200 transition-colors"
                  >
                    Đủ tiền ({formatVND(totalAmount)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAmount(50000)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    +50.000 đ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddAmount(100000)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    +100.000 đ
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(500000)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    500.000 đ
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetAmount(1000000)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                  >
                    1.000.000 đ
                  </button>
                </div>

                {/* BÀN PHÍM SỐ POS CẢM ỨNG CẢI TIẾN */}
                <div className="pt-1.5 border-t border-slate-100 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Bàn phím số POS:
                  </span>

                  <div className="grid grid-cols-3 gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleNumpadPress(digit)}
                        className="h-10 md:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-base md:text-lg flex items-center justify-center border border-slate-200/80 cursor-pointer active:scale-95 transition-all shadow-2xs"
                      >
                        {digit}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleNumpadPress('CLEAR')}
                      className="h-10 md:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1 border border-slate-200 cursor-pointer active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Xóa hết</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNumpadPress('0')}
                      className="h-10 md:h-11 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-base md:text-lg flex items-center justify-center border border-slate-200/80 cursor-pointer active:scale-95 transition-all shadow-2xs"
                    >
                      0
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNumpadPress('BACKSPACE')}
                      className="h-10 md:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1 border border-slate-200 cursor-pointer active:scale-95 transition-all"
                    >
                      <Delete className="w-3.5 h-3.5 text-slate-500" />
                      <span>Xóa</span>
                    </button>
                  </div>
                </div>

                {/* NÚT CHỐT THANH TOÁN TIỀN MẶT */}
                <button
                  onClick={() => onConfirmCashPayment(cashReceivedNum)}
                  disabled={isCashInsufficient}
                  className={`w-full h-10 md:h-11 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm transition-all ${
                    isCashInsufficient
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/60'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-xs'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận thanh toán bằng tiền mặt</span>
                </button>
              </div>
            )}

            {/* TAB 2: THANH TOÁN MÃ QR VIETQR PRO (RỘNG RÃI CÂN ĐỐI KHÔNG BỊ SCROLLBAR) */}
            {paymentMethodTab === 'QR' && (
              <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-xs">
                {isGeneratingQr && (
                  <div className="py-8 space-y-3 text-center">
                    <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
                    <p className="font-semibold text-slate-700 text-xs md:text-sm">Đang tạo mã VietQR Pro thanh toán cho {tableName}...</p>
                  </div>
                )}

                {!isGeneratingQr && !checkoutUrl && (
                  <div className="py-6 space-y-3 bg-slate-50/80 rounded-2xl border border-slate-200 text-center px-4">
                    <div className="w-11 h-11 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-2xs">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <h4 className="font-bold text-slate-900 text-sm">Thanh Toán Qua Mã QR VietQR Pro</h4>
                      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                        Tạo mã QR VietQR chuẩn để khách quét trực tiếp trên ứng dụng ngân hàng với số tiền{' '}
                        <strong className="text-slate-900 font-bold">{formatVND(totalAmount)}</strong>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onGenerateQr}
                      className="h-9 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-sm transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Tạo Mã QR Thanh Toán</span>
                    </button>
                  </div>
                )}

                {!isGeneratingQr && checkoutUrl && (
                  <div className="space-y-3">
                    {qrPaymentStatus === 'PENDING' && (
                      <div className="space-y-2.5">
                        <div className="p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-950 font-medium shadow-2xs">
                          <div className="p-1 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                            <Lightbulb className="w-4 h-4" />
                          </div>
                          <span>
                            Mở App Ngân hàng bất kỳ để <strong className="font-bold text-amber-950">quét mã VietQR</strong> hoặc <strong className="font-bold text-amber-950">chuyển khoản</strong> số tiền bên dưới
                          </span>
                        </div>

                        {/* 2 CỘT NẰM NGANG RỘNG RÃI TRÊN MỌI MÀN HÌNH */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* CỘT TRÁI: MÃ QR CODE VIETQR PRO CỠ RÕ NÉT */}
                          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-2 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-3">
                            <div className="flex items-center gap-1 font-bold text-xs text-slate-800">
                              <span className="text-red-600 text-xs">Viet</span>
                              <span className="text-blue-600 text-xs">QR</span>
                              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[9px] rounded font-bold uppercase ml-0.5">PRO</span>
                            </div>

                            <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                              <img
                                src={qrCodeImageUrl}
                                alt="Mã QR VietQR"
                                className="w-52 h-52 md:w-56 md:h-56 object-contain rounded-lg"
                              />
                              <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100 mt-1 px-1">
                                <span className="text-blue-600 font-extrabold">napas247</span>
                                <span className="text-red-600 font-extrabold">MBBANK</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {onManualSyncPayment && (
                                <button
                                  type="button"
                                  onClick={onManualSyncPayment}
                                  className="px-3 py-1 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Kiểm tra thanh toán</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={onCancelQrPayment}
                                className="px-3 py-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95"
                              >
                                <Ban className="w-3.5 h-3.5 text-slate-500" />
                                <span>Huỷ Giao Dịch</span>
                              </button>
                            </div>
                          </div>

                          {/* CỘT PHẢI: CHI TIẾT CHUYỂN KHOẢN GỌN GÀNG FIT MÀN HÌNH */}
                          <div className="md:col-span-7 space-y-2 text-left pl-1">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                                MB
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase">Ngân hàng</p>
                                <p className="font-bold text-slate-900 text-xs">{accountInfo.bankName}</p>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] text-slate-400 font-medium uppercase">Chủ tài khoản:</p>
                              <p className="font-bold text-slate-900 text-xs tracking-wide uppercase">{accountInfo.accountName}</p>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase">Số tài khoản:</p>
                                <p className="font-mono font-bold text-slate-900 text-xs">{accountInfo.accountNumber}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(accountInfo.accountNumber, 'accountNumber')}
                                className={`px-2 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                  copiedField === 'accountNumber'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                }`}
                              >
                                {copiedField === 'accountNumber' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedField === 'accountNumber' ? 'Đã sao chép' : 'Sao chép'}</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/80">
                              <div>
                                <p className="text-[10px] text-emerald-700 font-medium uppercase">Số tiền:</p>
                                <p className="font-bold text-emerald-600 text-sm">{formatVND(totalAmount)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(totalAmount.toString(), 'amount')}
                                className={`px-2 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                  copiedField === 'amount'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                }`}
                              >
                                {copiedField === 'amount' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedField === 'amount' ? 'Đã sao chép' : 'Sao chép'}</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                              <div>
                                <p className="text-[10px] text-slate-400 font-medium uppercase">Nội dung:</p>
                                <p className="font-mono font-semibold text-slate-900 text-xs">{transferMemo}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(transferMemo, 'memo')}
                                className={`px-2 py-1 rounded-lg font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                                  copiedField === 'memo'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                }`}
                              >
                                {copiedField === 'memo' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedField === 'memo' ? 'Đã sao chép' : 'Sao chép'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {qrPaymentStatus === 'SUCCESS' && (
                      <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-6 text-center space-y-4 shadow-sm animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-2xs">
                          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base md:text-lg text-emerald-950 tracking-tight">
                            XÁC NHẬN THANH TOÁN THÀNH CÔNG 🎉
                          </h3>
                          <p className="text-xs md:text-sm text-emerald-800 mt-1 max-w-md mx-auto font-medium leading-relaxed">
                            Hệ thống đã nhận đủ <strong className="text-emerald-950 font-extrabold">{formatVND(totalAmount)}</strong> cho {tableName}.
                          </p>
                          {countdownSeconds !== undefined && countdownSeconds > 0 && (
                            <p className="text-xs font-bold text-emerald-700 mt-2 bg-emerald-100/80 px-3 py-1 rounded-full inline-block">
                              Tự động hoàn tất trong <span className="text-emerald-950 text-sm font-extrabold">{countdownSeconds}s</span>...
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs md:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {tableName.toLowerCase().includes('mang') ? 'Đóng & Hoàn Tất Clear Giỏ Món' : 'Đóng & Hoàn Tất Clear Bàn'}
                          </span>
                        </button>
                      </div>
                    )}

                    {qrPaymentStatus === 'FAILED' && (
                      <div className="bg-red-50 border border-red-300 rounded-2xl p-5 text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
                        <div>
                          <h3 className="font-bold text-sm text-red-950">Giao dịch QR không thành công</h3>
                          <p className="text-xs text-red-700 mt-1">Vui lòng thử lại hoặc chuyển sang thanh toán tiền mặt.</p>
                        </div>
                        <button
                          type="button"
                          onClick={onCancelQrPayment}
                          className="px-5 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs"
                        >
                          Thử lại
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};
