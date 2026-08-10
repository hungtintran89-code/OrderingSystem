import React, { useState, useEffect } from 'react';
import { StaffUser, StaffRole } from '../../types/admin';
import { fetchStaffUsersApi, createStaffApi, updateStaffApi, deleteStaffApi } from '../../api/adminApi';
import {
  ShieldCheck,
  Plus,
  Edit,
  Trash2,
  Lock,
  User,
  Phone,
  Mail,
  DollarSign,
  Key,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Modal, message, Popconfirm } from 'antd';

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Create Staff State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('STAFF');
  const [newSalary, setNewSalary] = useState<number>(7500000);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  // Modal Edit Staff State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<StaffRole>('STAFF');
  const [editSalary, setEditSalary] = useState<number>(0);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Table Password Visibility Toggle State
  const [showPasswordTable, setShowPasswordTable] = useState<Record<string, boolean>>({});

  const toggleTablePasswordVisibility = (staffId: string) => {
    setShowPasswordTable((prev) => ({
      ...prev,
      [staffId]: !prev[staffId],
    }));
  };

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchStaffUsersApi();
      setStaffList(data);
    } catch (err) {
      setError('Không thể tải danh sách nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffUsers();
  }, []);

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + ' đ';

  const getRoleLabel = (role: StaffRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'MANAGER':
        return { label: 'Quản Lý Nhà Hàng', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'KITCHEN':
        return { label: 'Đầu Bếp KDS', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'STAFF':
      default:
        return { label: 'Nhân Viên POS / Phục Vụ', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  // --- CREATE STAFF ACTION ---
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      message.error('Vui lòng điền đầy đủ Họ tên, Tên đăng nhập và Mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const created = await createStaffApi({
        fullName: newName.trim(),
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: newRole,
        salary: Number(newSalary),
        phone: newPhone.trim(),
      });

      setStaffList((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
      setIsCreateModalOpen(false);
      // Reset Form
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewUsername('');
      setNewPassword('123456');
      message.success(`Đã cấp tài khoản thành công cho nhân viên ${newName}!`);
      await loadStaffUsers();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể tạo tài khoản nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- EDIT STAFF ACTION ---
  const handleOpenEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setEditName(staff.name);
    setEditEmail(staff.email);
    setEditPhone(staff.phone);
    setEditRole(staff.role);
    setEditSalary(staff.salary || 7500000);
    setEditUsername(staff.username || '');
    setEditPassword('');
    setIsEditModalOpen(true);
  };

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editName.trim()) {
      message.error('Vui lòng nhập Họ tên nhân viên');
      return;
    }

    try {
      setLoading(true);
      const updated = await updateStaffApi(editingStaff.id, {
        fullName: editName.trim(),
        role: editRole,
        salary: Number(editSalary),
        phone: editPhone.trim(),
        password: editPassword.trim() || undefined,
      });

      setStaffList((prev) => (Array.isArray(prev) ? prev.map((s) => (s.id === editingStaff.id ? updated : s)) : []));
      setIsEditModalOpen(false);
      message.success(`Đã cập nhật thành công thông tin nhân viên ${editName}!`);
      await loadStaffUsers();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể cập nhật thông tin nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE / DEACTIVATE STAFF ACTION ---
  const handleDeleteStaff = async (staffId: string) => {
    try {
      setLoading(true);
      await deleteStaffApi(staffId);
      setStaffList((prev) => (Array.isArray(prev) ? prev.filter((s) => s.id !== staffId) : []));
      await loadStaffUsers();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa tài khoản nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* HEADER TOOLBAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-orange-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Quản Lý Nhân Viên & Ma Trận Phân Quyền RBAC</h3>
            <p className="text-[11px] text-slate-500">Cấp tài khoản, mức lương và phân quyền truy cập hệ thống</p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-9 px-4 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-98 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Thêm Nhân Viên</span>
        </button>
      </div>

      {/* 4 UI STATES HANDLING */}

      {/* STATE 2: LOADING SKELETON */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div className="h-4 bg-slate-200 rounded w-40"></div>
              <div className="h-6 bg-slate-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      )}

      {/* STATE 3: ERROR STATE */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-bold text-red-900">{error}</h3>
          <button
            onClick={loadStaffUsers}
            className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {/* STATE 1: NORMAL DATA STAFF TABLE */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 min-w-[920px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 min-w-[200px]">Họ & Tên Nhân Viên</th>
                  <th className="px-4 py-3.5 min-w-[220px]">Liên Hệ (Email & SĐT)</th>
                  <th className="px-4 py-3.5 min-w-[150px]">Mật Khẩu</th>
                  <th className="px-4 py-3.5 min-w-[160px]">Vai Trò (Role)</th>
                  <th className="px-4 py-3.5 min-w-[140px]">Mức Lương (VND)</th>
                  <th className="px-4 py-3.5 text-right min-w-[90px]">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(Array.isArray(staffList) ? staffList : []).map((usr) => {
                  const roleBadge = getRoleLabel(usr.role);
                  return (
                    <tr key={usr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {usr.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs sm:text-sm">{usr.name}</p>
                            <span className="text-[10px] text-slate-400">Đăng nhập: {usr.lastActive}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-xs font-semibold text-slate-800">{usr.email}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{usr.phone}</p>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded-md border border-slate-200 inline-block min-w-[80px] text-center font-bold">
                            {showPasswordTable[usr.id]
                              ? (usr.password || '123456')
                              : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleTablePasswordVisibility(usr.id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title={showPasswordTable[usr.id] ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showPasswordTable[usr.id] ? <EyeOff className="w-4 h-4 text-orange-600" /> : <Eye className="w-4 h-4 text-slate-500" />}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border inline-block ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-extrabold text-slate-900">
                        {usr.salary ? formatVND(usr.salary) : '7.500.000 đ'}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-1">
                        {/* Nút Thao Tác: Chỉnh Sửa Nhân Viên */}
                        <button
                          onClick={() => handleOpenEditModal(usr)}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-600 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs"
                          title="Chỉnh sửa thông tin nhân viên & mật khẩu"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Nút Xóa Nhân Viên */}
                        <Popconfirm
                          title="Xóa nhân viên"
                          description={`Bạn có chắc muốn xóa tài khoản ${usr.name}?`}
                          onConfirm={() => handleDeleteStaff(usr.id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <button
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-300 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                            title="Xóa nhân viên này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Popconfirm>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. MODAL TẠO NHÂN VIÊN MỚI (CHỌN ROLE, LƯƠNG, TÀI KHOẢN MẬT KHẨU) */}
      <Modal
        title="➕ Tạo Tài Khoản & Phân Quyền Nhân Viên Mới"
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleCreateStaff} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ & Tên nhân viên *</label>
            <input
              type="text"
              required
              placeholder="VD: Lê Thị Thu Ngân"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phân Quyền / Role *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as StaffRole)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                <option value="STAFF">Nhân Viên POS / Phục Vụ</option>
                <option value="KITCHEN">Đầu Bếp KDS</option>
                <option value="MANAGER">Quản Lý Nhà Hàng</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức Lương (VND/Tháng) *</label>
              <input
                type="number"
                required
                min={1000000}
                step={500000}
                placeholder="VD: 8500000"
                value={newSalary}
                onChange={(e) => setNewSalary(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                placeholder="VD: 0912345678"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
              <input
                type="email"
                placeholder="VD: thungan@restaurant.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          {/* CẤP TÀI KHOẢN & MẬT KHẨU */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" /> Cấp Tài Khoản Đăng Nhập Hệ Thống
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username) *</label>
              <input
                type="text"
                required
                placeholder="VD: thungan_pos"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu khởi tạo *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer"
            >
              Cấp Tài Khoản Nhân Viên
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. MODAL CHỈNH SỬA THÔNG TIN NHÂN VIÊN */}
      <Modal
        title="✏️ Chỉnh Sửa Thông Tin & Phân Quyền Nhân Viên"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <form onSubmit={handleSaveEditStaff} className="space-y-4 pt-2 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ & Tên nhân viên *</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phân Quyền / Role *</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as StaffRole)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500 cursor-pointer"
              >
                <option value="STAFF">Nhân Viên POS / Phục Vụ</option>
                <option value="KITCHEN">Đầu Bếp KDS</option>
                <option value="MANAGER">Quản Lý Nhà Hàng</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức Lương (VND/Tháng) *</label>
              <input
                type="number"
                required
                min={1000000}
                step={500000}
                value={editSalary}
                onChange={(e) => setEditSalary(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email liên hệ</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-orange-500"
              />
            </div>
          </div>

          {/* CẬP NHẬT TÀI KHOẢN & ĐỔI MẬT KHẨU */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-orange-600" /> Đổi Mật Khẩu / Tên Đăng Nhập
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username)</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
              <div className="relative">
                <input
                  type={showEditPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu mới..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 pr-10 rounded-lg border border-slate-200 bg-white text-xs focus:border-orange-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
