"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Loader2, Search, UsersIcon, RefreshCw, Filter, X, Eye, EyeOff } from 'lucide-react';
import { Alert, useToast, ToastContainer } from '@/components/ui/alert';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';

// Badge Component
const Badge = ({ variant, children }: any) => {
  const colors: any = {
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[variant] || colors.info}`}>{children}</span>;
};

// Multi-Select Filter Component
const MultiSelectFilter = ({ column, title, table }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const columnFilterValue = column.getFilterValue() || [];
  const uniqueValues = useMemo(() => {
    const values = new Set();
    const columnId = column.id;
    const allRows = table.getPreFilteredRowModel().rows;
    allRows.forEach((row: any) => {
      const value = row.getValue(columnId);
      const stringValue = String(value !== null && value !== undefined && value !== '' ? value : '(Empty)');
      values.add(stringValue);
    });
    const sorted = Array.from(values).sort((a: any, b: any) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    return sortOrder === 'desc' ? sorted.reverse() : sorted;
  }, [table, column, sortOrder]);

  const filteredValues = uniqueValues.filter((value: any) => value?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleValue = (value: string) => {
    const currentFilter = column.getFilterValue() || [];
    const newFilter = currentFilter.includes(value)
      ? currentFilter.filter((v: string) => v !== value)
      : [...currentFilter, value];
    column.setFilterValue(newFilter.length > 0 ? newFilter : undefined);
  };

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.top + window.scrollY, left: rect.right + window.scrollX + 4 });
    }
    setIsOpen(!isOpen);
  };

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      let newTop = position.top;
      let newLeft = position.left;
      if (rect.right > window.innerWidth - 10) {
        newLeft = position.left - rect.width - (buttonRef.current?.offsetWidth || 0) - 8;
      }
      if (rect.bottom > window.innerHeight - 10) {
        newTop = window.innerHeight - rect.height - 10;
      }
      if (newTop !== position.top || newLeft !== position.left) {
        setPosition({ top: newTop, left: newLeft });
      }
    }
  }, [isOpen, position]);

  const selectAll = () => {
    if (filteredValues.length === 0) return;
    if (columnFilterValue.length === filteredValues.length) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(filteredValues);
    }
  };

  const clearAll = () => { column.setFilterValue(undefined); };

  const popupContent = isOpen && mounted ? (
    <div>
      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      <div 
        ref={dropdownRef} 
        className="absolute z-50 min-w-[280px] w-max max-w-[400px] max-h-[500px] flex flex-col rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark shadow-2xl" 
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={() => setSortOrder('asc')} className={`flex-1 px-4 py-2 text-xs font-medium transition ${sortOrder === 'asc' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>↑ Ascending</button>
          <button onClick={() => setSortOrder('desc')} className={`flex-1 px-4 py-2 text-xs font-medium transition ${sortOrder === 'desc' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>↓ Descending</button>
        </div>
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
        </div>
        <div className="overflow-y-auto p-2 flex-1 min-h-0">
          <label className="flex items-center gap-2 rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            <input type="checkbox" checked={columnFilterValue.length === filteredValues.length && filteredValues.length > 0} onChange={selectAll} className="rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select All</span>
          </label>
          {filteredValues.map((value: any) => (
            <label key={value} className="flex items-center gap-2 rounded px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <input type="checkbox" checked={columnFilterValue.includes(value)} onChange={() => toggleValue(value)} className="rounded border-gray-300 text-primary focus:ring-primary" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
            </label>
          ))}
          {filteredValues.length === 0 && (<div className="px-3 py-2 text-sm text-gray-500 text-center">No results found</div>)}
        </div>
        <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-700 flex-shrink-0">
          <button onClick={clearAll} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Clear</button>
          <button onClick={() => setIsOpen(false)} className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90">Apply</button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button ref={buttonRef} onClick={handleToggle} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200">
        <Filter className="h-3 w-3" />
        {columnFilterValue.length > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] text-white">{columnFilterValue.length}</span>
        )}
      </button>
      {mounted && typeof document !== 'undefined' && createPortal(popupContent, document.body)}
    </>
  );
};

// Indeterminate Checkbox Component
const IndeterminateCheckbox = ({ checked, indeterminate, onChange }: any) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="rounded border-gray-300 text-primary focus:ring-primary"
    />
  );
};

function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState<any>({
    nama_lengkap: '',
    username: '',
    email: '',
    password: '',
    role_id: 0,
    divisi_id: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [divisi, setDivisi] = useState<any[]>([]);
  const [groupedDivisi, setGroupedDivisi] = useState<any>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.msg || err.message || "Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fetchRolesAndDivisi = async () => {
    try {
      const [rolesRes, divisiRes] = await Promise.all([
        api.get('/master/roles'),
        api.get('/master/divisi')
      ]);
      setRoles(rolesRes.data);
      setDivisi(divisiRes.data);
      
      // Group divisi by kode_divisi
      const grouped = divisiRes.data.reduce((acc: any, div: any) => {
        if (!acc[div.kode_divisi]) {
          acc[div.kode_divisi] = [];
        }
        acc[div.kode_divisi].push(div);
        return acc;
      }, {});
      setGroupedDivisi(grouped);
    } catch (err) {
      console.error('Error fetching roles/divisi:', err);
    }
  };

  const handleAdd = () => {
    setNewUser({
      nama_lengkap: '',
      username: '',
      email: '',
      password: '',
      role_id: 0,
      divisi_id: 0,
    });
    setShowPassword(false);
    fetchRolesAndDivisi();
    setShowAddModal(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser({
      user_id: user.user_id,
      nama_lengkap: user.nama_lengkap,
      username: user.username,
      email: user.email,
      role_id: Number(user.role_id) || 0,
      divisi_id: user.divisi_id,
      is_active: user.is_active,
    });
    fetchRolesAndDivisi();
    setShowEditModal(true);
  };

  const handleSaveAdd = async () => {
    if (!newUser.nama_lengkap || !newUser.username || !newUser.email || !newUser.password || !newUser.role_id || newUser.role_id === 0 || newUser.divisi_id === 0) {
      addToast({
        variant: 'error',
        title: 'Error',
        message: 'Mohon isi semua field yang wajib!',
      });
      return;
    }

    if (newUser.password.length < 6) {
      addToast({
        variant: 'error',
        title: 'Error',
        message: 'Password minimal 6 karakter!',
      });
      return;
    }

    try {
      setSaving(true);
      await api.post('/auth/register', {
        nama_lengkap: newUser.nama_lengkap,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role_id: newUser.role_id,
        divisi_id: newUser.divisi_id,
      });
      addToast({
        variant: 'success',
        title: 'Success',
        message: 'User berhasil ditambahkan!',
      });
      setShowAddModal(false);
      setShowPassword(false);
      fetchData();
    } catch (err: any) {
      addToast({
        variant: 'error',
        title: 'Error',
        message: err.response?.data?.msg || 'Gagal menambahkan user!',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    // Debug log
    console.log('editingUser before validation:', editingUser);
    console.log('role_id type:', typeof editingUser.role_id, 'value:', editingUser.role_id);

    // Validation
    if (!editingUser.nama_lengkap || !editingUser.email || !editingUser.role_id || editingUser.role_id === 0 || editingUser.role_id === '') {
      console.log('Validation failed:', {
        nama_lengkap: editingUser.nama_lengkap,
        email: editingUser.email,
        role_id: editingUser.role_id,
        checks: {
          hasNama: !!editingUser.nama_lengkap,
          hasEmail: !!editingUser.email,
          hasRole: !!editingUser.role_id,
          roleIsZero: editingUser.role_id === 0,
          roleIsEmpty: editingUser.role_id === ''
        }
      });
      addToast({
        variant: 'error',
        title: 'Error',
        message: 'Nama Lengkap, Email, dan Role wajib diisi!',
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Sending to API:', {
        nama_lengkap: editingUser.nama_lengkap,
        username: editingUser.username,
        email: editingUser.email,
        role_id: editingUser.role_id,
        divisi_id: editingUser.divisi_id,
        is_active: editingUser.is_active,
      });
      await api.put(`/users/${editingUser.user_id}`, {
        nama_lengkap: editingUser.nama_lengkap,
        username: editingUser.username,
        email: editingUser.email,
        role_id: editingUser.role_id,
        divisi_id: editingUser.divisi_id,
        is_active: editingUser.is_active,
      });
      addToast({
        variant: 'success',
        title: 'Success',
        message: 'User berhasil diupdate!',
      });
      setShowEditModal(false);
      setEditingUser(null);
      fetchData();
    } catch (err: any) {
      addToast({
        variant: 'error',
        title: 'Validation Errors',
        message: err.response?.data?.msg || 'Gagal mengupdate user. Please correct the errors and try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, userName: string) => {
    if (!confirm(`Hapus user "${userName}"?\n\nPeringatan:\n• Data user akan dihapus permanent\n• User tidak akan bisa login lagi\n• Riwayat aktivitas user akan tetap tersimpan`)) return;
    
    try {
      setDeleting(userId);
      await api.delete(`/users/${userId}`);
      addToast({
        variant: 'success',
        title: 'Success',
        message: 'User berhasil dihapus!',
      });
      fetchData();
    } catch (err: any) {
      addToast({
        variant: 'error',
        title: 'Error',
        message: err.response?.data?.msg || 'Gagal menghapus user.',
      });
    } finally {
      setDeleting(null);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'nama_lengkap',
      header: () => <div className="text-center">Nama</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue('nama_lengkap')}</div>,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      accessorKey: 'email',
      header: () => <div className="text-center">Email</div>,
      cell: ({ row }) => <div className="text-center">{row.getValue('email') || '-'}</div>,
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      accessorKey: 'nama_role',
      header: () => <div className="text-center">Role</div>,
      cell: ({ row }) => {
        const role = row.getValue('nama_role');
        const variant = String(role).toLowerCase().includes('admin') ? 'purple' : 'info';
        return <div className="flex justify-center"><Badge variant={variant}>{role || '-'}</Badge></div>;
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const value = row.getValue(columnId) || '-';
        return filterValue.includes(String(value));
      },
      meta: { isNumeric: true },
    },
    {
      accessorKey: 'nama_divisi',
      header: () => <div className="text-center">Divisi</div>,
      cell: ({ row }) => {
        const kodeDivisi = row.original.kode_divisi;
        if (!kodeDivisi) return <div className="text-center">-</div>;
        
        // Find all divisi names for this kode
        const allNamesInKode = divisi
          .filter((d: any) => d.kode_divisi === kodeDivisi)
          .map((d: any) => d.nama_divisi)
          .join(', ');
        
        const displayText = allNamesInKode ? `${kodeDivisi} - ${allNamesInKode}` : kodeDivisi;
        return <div className="text-center">{displayText}</div>;
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const value = row.getValue(columnId) || '-';
        return filterValue.includes(String(value));
      },
      meta: { isNumeric: true },
    },
    {
      accessorKey: 'is_active',
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const isActive = row.getValue('is_active');
        return <div className="flex justify-center"><Badge variant={isActive ? 'success' : 'danger'}>{isActive ? 'Aktif' : 'Nonaktif'}</Badge></div>;
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const isActive = row.getValue(columnId);
        const statusText = isActive ? 'Aktif' : 'Nonaktif';
        return filterValue.includes(statusText);
      },
      meta: { isNumeric: true },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Aksi</div>,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => handleEdit(user)} 
              className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
              title="Edit User"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleDelete(user.user_id, user.nama_lengkap)}
              disabled={deleting === user.user_id}
              className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600 disabled:opacity-50"
              title="Delete User"
            >
              {deleting === user.user_id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      meta: { isNumeric: true },
    },
  ], [router, deleting, divisi]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20">{error}</div>;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">User Management</h1>
        <p className="mt-2 text-sm text-bodydark1">Kelola akses dan hak user sistem</p>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-black dark:text-white">Tambah User Baru</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowPassword(false);
                }}
                disabled={saving}
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.nama_lengkap}
                  onChange={(e) => setNewUser({ ...newUser, nama_lengkap: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Username */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder="Masukkan username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder="user@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 pr-12 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role_id}
                  onChange={(e) => setNewUser({ ...newUser, role_id: Number(e.target.value) })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value={0}>Pilih Role</option>
                  {roles.map((r: any) => (
                    <option key={r.role_id} value={r.role_id}>{r.nama_role}</option>
                  ))}
                </select>
              </div>

              {/* Divisi */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Divisi <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.divisi_id}
                  onChange={(e) => setNewUser({ ...newUser, divisi_id: Number(e.target.value) })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value={0}>Pilih Divisi</option>
                  {Object.entries(groupedDivisi).map(([kode, divisiArray]: [string, any]) => {
                    // Use the first entry's divisi_id to represent the entire group
                    const firstEntry = divisiArray[0];
                    const allNames = divisiArray.map((d: any) => d.nama_divisi).join(', ');
                    return (
                      <option key={kode} value={firstEntry.divisi_id}>
                        {kode} - {allNames}
                      </option>
                    );
                  })}
                </select>
                {newUser.divisi_id > 0 && (() => {
                  const selectedDiv = divisi.find((d: any) => d.divisi_id === newUser.divisi_id);
                  const kode = selectedDiv?.kode_divisi;
                  const allNamesInKode = groupedDivisi[kode]?.map((d: any) => d.nama_divisi).join(', ') || '';
                  return (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">✓ Divisi yang akan di-assign:</p>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        {kode} - {allNamesInKode}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">💡 User akan bisa mengakses semua produk dalam divisi {kode}</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowPassword(false);
                }}
                disabled={saving}
                className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark rounded-lg px-5 py-2.5 text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAdd}
                disabled={saving || !newUser.nama_lengkap || !newUser.username || !newUser.email || !newUser.password || !newUser.role_id || newUser.role_id === 0 || newUser.divisi_id === 0}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Tambah User'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-black dark:text-white">Edit User</h2>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingUser.nama_lengkap}
                  onChange={(e) => setEditingUser({ ...editingUser, nama_lengkap: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                  placeholder="user@example.com"
                />
              </div>

              {/* Role */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingUser.role_id}
                  onChange={(e) => setEditingUser({ ...editingUser, role_id: Number(e.target.value) })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value={0}>Pilih Role</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.nama_role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Divisi */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Divisi
                </label>
                <select
                  value={editingUser.divisi_id || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, divisi_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                >
                  <option value="">Tidak Ada Divisi</option>
                  {Object.entries(groupedDivisi).map(([kode, divisiArray]: [string, any]) => {
                    // Use the first entry's divisi_id to represent the entire group
                    const firstEntry = divisiArray[0];
                    const allNames = divisiArray.map((d: any) => d.nama_divisi).join(', ');
                    return (
                      <option key={kode} value={firstEntry.divisi_id}>
                        {kode} - {allNames}
                      </option>
                    );
                  })}
                </select>
                {editingUser.divisi_id && (() => {
                  const selectedDiv = divisi.find((d: any) => d.divisi_id === editingUser.divisi_id);
                  const kode = selectedDiv?.kode_divisi;
                  const allNamesInKode = groupedDivisi[kode]?.map((d: any) => d.nama_divisi).join(', ') || '';
                  return (
                    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">✓ Divisi yang akan di-assign:</p>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                        {kode} - {allNamesInKode}
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">💡 User akan bisa mengakses semua produk dalam divisi {kode}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Status Aktif */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                  Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingUser.is_active === 1}
                      onChange={() => setEditingUser({ ...editingUser, is_active: 1 })}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-black dark:text-white">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={editingUser.is_active === 0}
                      onChange={() => setEditingUser({ ...editingUser, is_active: 0 })}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-black dark:text-white">Nonaktif</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={saving}
                className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark rounded-lg px-5 py-2.5 text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editingUser.nama_lengkap || !editingUser.email || !editingUser.role_id || editingUser.role_id === 0}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-bodydark" />
          <input 
            type="text" 
            placeholder="Cari semua kolom..." 
            value={globalFilter ?? ''} 
            onChange={(e) => setGlobalFilter(e.target.value)} 
            className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-10 pr-4 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white" 
          />
        </div>
        <div className="flex gap-3">
          <button onClick={handleAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"><Plus className="h-4 w-4" />Tambah User</button>
          <button onClick={fetchData} className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium dark:text-white"><RefreshCw className="h-4 w-4" />Refresh</button>
          <Link href="/users/log"><button className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium dark:text-white">Activity Log</button></Link>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs font-medium uppercase text-black dark:text-white">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanFilter() && (
                          <MultiSelectFilter column={header.column} table={table} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <UsersIcon className="mx-auto h-12 w-12 text-bodydark mb-2" />
                    <p className="text-bodydark">Tidak ada data user</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-stroke hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4">
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as any;
                      return (
                        <td key={cell.id} className={`px-4 py-5 text-sm dark:text-white ${
                          meta?.isNumeric ? 'text-center' : ''
                        }`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-stroke px-6 py-4 dark:border-strokedark">
          <div className="text-sm text-bodydark">
            Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} dari {table.getFilteredRowModel().rows.length}
          </div>
          <div className="flex gap-2">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">First</button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">Previous</button>
            <span className="px-3 py-1 text-sm text-bodydark">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">Next</button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">Last</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(UsersPage);
