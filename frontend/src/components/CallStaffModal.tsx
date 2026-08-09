import React, { useState } from 'react';
import { Modal, Radio, Input, Button, message } from 'antd';

interface CallStaffModalProps {
  open: boolean;
  onClose: () => void;
  tableInfo?: string;
}

export const CallStaffModal: React.FC<CallStaffModalProps> = ({ open, onClose, tableInfo = 'Bàn 12 - Tầng 1' }) => {
  const [requestType, setRequestType] = useState<string>('water');
  const [note, setNote] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSendRequest = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('🔔 Đã gửi yêu cầu gọi phục vụ! Nhân viên sẽ đến ngay.');
      onClose();
      setNote('');
    }, 800);
  };

  const quickOptions = [
    { value: 'water', label: '🥤 Thêm nước lọc / Trà đá' },
    { value: 'utensils', label: '🥢 Thêm đũa, chén, thìa, khăn lạnh' },
    { value: 'sauce', label: '🧂 Thêm gia vị / Nước chấm' },
    { value: 'other', label: '💬 Yêu cầu khác' },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <span className="text-2xl">🔔</span>
          <div>
            <h3 className="font-bold text-lg font-heading">Gọi Nhân Viên Phục Vụ</h3>
            <p className="text-xs text-orange-600 font-normal">{tableInfo}</p>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      className="rounded-2xl overflow-hidden"
    >
      <div className="py-3 space-y-4">
        <p className="text-sm text-slate-600">Vui lòng chọn yêu cầu nhanh bên dưới để nhà hàng phục vụ bạn tốt nhất:</p>
        
        <Radio.Group
          value={requestType}
          onChange={(e) => setRequestType(e.target.value)}
          className="w-full space-y-2.5"
        >
          {quickOptions.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center w-full p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                requestType === opt.value
                  ? 'border-orange-500 bg-orange-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-orange-200'
              }`}
            >
              <Radio value={opt.value} className="mr-2" />
              <span className="font-medium text-slate-800 text-sm">{opt.label}</span>
            </label>
          ))}
        </Radio.Group>

        {requestType === 'other' && (
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú chi tiết yêu cầu của bạn (VD: Dọn bàn, lấy thêm ghế trẻ em...)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-xl border-slate-300 focus:border-orange-500"
          />
        )}

        <div className="pt-2 flex gap-3">
          <Button
            size="large"
            className="flex-1 h-12 rounded-xl font-medium"
            onClick={onClose}
          >
            Hủy Bỏ
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSendRequest}
            className="flex-1 h-12 rounded-xl font-bold bg-orange-600 hover:bg-orange-700 border-none shadow-md shadow-orange-600/20"
          >
            Gửi Yêu Cầu
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CallStaffModal;
