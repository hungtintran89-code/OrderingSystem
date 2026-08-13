import React, { useState } from 'react';
import { Modal, Button, Radio, Divider, Tag, message } from 'antd';

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

interface BillPaymentModalProps {
  open: boolean;
  onClose: () => void;
  tableInfo?: string;
  items?: BillItem[];
}

export const BillPaymentModal: React.FC<BillPaymentModalProps> = ({
  open,
  onClose,
  tableInfo = 'Bàn 12 - Tầng 1',
  items = [
    { id: '1', name: 'Phở Bò Đặc Biệt (Bát Lớn)', quantity: 2, price: 85000, note: 'Ít hành, thêm bánh phở' },
    { id: '2', name: 'Gỏi Cuốn Tôm Thịt (3 Cuốn)', quantity: 1, price: 45000 },
    { id: '3', name: 'Trà Đá Hoa Cúc', quantity: 2, price: 15000 },
  ],
}) => {
  const [paymentMethod, setPaymentMethod] = useState<string>('qr');
  const [loading, setLoading] = useState<boolean>(false);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vat = subtotal * 0.08; // 8% VAT
  const total = subtotal + vat;

  const handleRequestBill = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('💳 Yêu cầu tính tiền đã được chuyển tới thu ngân! Nhân viên sẽ mang hóa đơn đến ngay.');
      onClose();
    }, 900);
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between border-b pb-3 mr-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            <div>
              <h3 className="font-bold text-lg font-heading text-slate-900">Yêu Cầu Tính Tiền</h3>
              <p className="text-xs text-orange-600 font-medium">{tableInfo}</p>
            </div>
          </div>
          <Tag color="orange" className="font-semibold text-xs px-2.5 py-0.5 rounded-full">
            Đơn tạm tính
          </Tag>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      className="rounded-2xl overflow-hidden"
    >
      <div className="py-2 space-y-4">
        {/* Bill Summary Items */}
        <div className="max-h-60 overflow-y-auto pr-1 space-y-2.5 divide-y divide-slate-100">
          {items.map((item) => (
            <div key={item.id} className="pt-2 flex justify-between items-start text-sm">
              <div className="flex-1 pr-3">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-md font-bold">
                    x{item.quantity}
                  </span>
                  <span>{item.name}</span>
                </div>
                {item.note && <p className="text-xs text-slate-400 mt-0.5 italic">Ghi chú: {item.note}</p>}
              </div>
              <span className="font-medium text-slate-900">
                {(item.price * item.quantity).toLocaleString('vi-VN')} đ
              </span>
            </div>
          ))}
        </div>

        <Divider className="my-2" />

        {/* Financial Totals */}
        <div className="space-y-1.5 text-sm bg-slate-50 p-3.5 rounded-xl">
          <div className="flex justify-between text-slate-600">
            <span>Tiền món ăn:</span>
            <span>{subtotal.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Thuế VAT (8%):</span>
            <span>{vat.toLocaleString('vi-VN')} đ</span>
          </div>
          <div className="flex justify-between font-bold text-base text-slate-900 pt-1 border-t border-slate-200 mt-1">
            <span>Tổng cần thanh toán:</span>
            <span className="text-orange-600 text-lg font-extrabold">{total.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Phương Thức Thanh Toán
          </label>
          <Radio.Group
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full grid grid-cols-3 gap-2"
          >
            {[
              { id: 'qr', label: 'Chuyển Khoản QR', icon: '📱' },
              { id: 'cash', label: 'Tiền Mặt', icon: '💵' },
              { id: 'card', label: 'Thẻ ATM/POS', icon: '💳' },
            ].map((method) => (
              <label
                key={method.id}
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer text-center transition-all ${
                  paymentMethod === method.id
                    ? 'border-green-600 bg-green-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <Radio value={method.id} className="sr-only" />
                <span className="text-xl mb-1">{method.icon}</span>
                <span className="text-xs font-bold text-slate-800">{method.label}</span>
              </label>
            ))}
          </Radio.Group>
        </div>

        <div className="pt-2 flex gap-3">
          <Button size="large" className="flex-1 h-12 rounded-xl font-medium" onClick={onClose}>
            Xem Thêm Món
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleRequestBill}
            className="flex-1 h-12 rounded-xl font-bold bg-green-600 hover:bg-green-700 border-none shadow-md shadow-green-600/20"
          >
            Xác Nhận Tính Tiền
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BillPaymentModal;
