"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, Edit, Trash2, Loader2, Search, Package, AlertTriangle, RefreshCw, Filter, Upload, X
} from 'lucide-react';
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
      
      // Special handling for is_active_wh* columns
      if (columnId.startsWith('is_active_wh')) {
        const statusText = value === 1 ? 'Aktif' : 'Nonaktif';
        values.add(statusText);
      } else if (value !== null && value !== undefined && value !== '') {
        // Check if it's a numeric value
        const numValue = parseFloat(String(value));
        if (!isNaN(numValue) && String(value).includes('.')) {
          // Remove .000 from decimal numbers
          const intValue = Math.floor(numValue);
          values.add(String(intValue));
        } else {
          values.add(String(value));
        }
      } else {
        values.add('(Empty)');
      }
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
        className="absolute z-50 min-w-[280px] w-max max-w-[400px] max-h-[500px] flex flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" 
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

function ProdukPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadWarehouse, setUploadWarehouse] = useState<'wh01' | 'wh02' | 'wh03'>('wh01');
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [divisiList, setDivisiList] = useState<any[]>([]);
  const [rakList, setRakList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'wh01' | 'wh02' | 'wh03'>('wh01');
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/produk');
      setProducts(res.data);
    } catch (err: any) {
      setError(err.response?.data?.msg || err.message || "Gagal memuat data produk.");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (activeTab === 'wh01') return product.is_active_wh01 === 1;
      if (activeTab === 'wh02') return product.is_active_wh02 === 1;
      if (activeTab === 'wh03') return product.is_active_wh03 === 1;
      return true;
    });
  }, [products, activeTab]);

  const fetchMasterData = async () => {
    try {
      const [divisiRes, rakRes] = await Promise.all([
        api.get('/master/divisi'),
        api.get('/master/rak')
      ]);
      setDivisiList(divisiRes.data);
      setRakList(rakRes.data);
    } catch (err) {
      console.error('Gagal memuat master data:', err);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchMasterData();
  }, []);

  // Shortcut keyboard 'R' untuk refresh
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;
      
      if (isInputFocused || isContentEditable || loading) {
        return;
      }
      
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        fetchData();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [loading]);

  const handleDelete = (product: any) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      setDeleting(productToDelete.produk_id);
      await api.delete(`/produk/${productToDelete.produk_id}`);
      await fetchData();
      setShowDeleteModal(false);
      setProductToDelete(null);
      addToast({ variant: 'success', message: 'Produk berhasil dihapus!' });
    } catch (err: any) {
      addToast({ variant: 'error', message: err.response?.data?.msg || "Gagal menghapus produk" });
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = async (product: any) => {
    try {
      // Fetch detail lengkap produk
      const res = await api.get(`/produk/${product.produk_id}`);
      const detail = res.data;
      
      setEditingProduct(detail);
      setEditFormData({
        nama_barang: detail.nama_barang || '',
        barcode: detail.barcode || '',
        divisi_id: detail.divisi_id || '',
        sistem_karton: detail.sistem_karton || 0,
        sistem_tengah: detail.sistem_tengah || 0,
        sistem_pieces: detail.sistem_pieces || 0,
        expired_date: detail.expired_date ? detail.expired_date.split('T')[0] : '',
        rak_id: detail.rak_id || '',
        sistem_total_pcs_bs: detail.sistem_total_pcs_bs || 0,
        sistem_total_pcs_promo: detail.sistem_total_pcs_promo || 0,
      });
      setShowEditModal(true);
    } catch (err) {
      addToast({ variant: 'error', message: 'Gagal memuat detail produk' });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    
    try {
      setSaving(true);
      await api.put(`/produk/${editingProduct.produk_id}`, editFormData);
      await fetchData();
      setShowEditModal(false);
      setEditingProduct(null);
      setEditFormData({});
      addToast({ variant: 'success', message: 'Produk berhasil diupdate!' });
    } catch (err: any) {
      addToast({ variant: 'error', message: err.response?.data?.msg || 'Gagal menyimpan perubahan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Object.keys(rowSelection).map(idx => filteredProducts[parseInt(idx)].produk_id);
    const confirmed = confirm(`Yakin ingin menghapus ${selectedIds.length} produk terpilih?`);
    if (!confirmed) return;

    try {
      setLoading(true);
      
      // Delete with better error handling
      const results = await Promise.allSettled(
        selectedIds.map(id => api.delete(`/produk/${id}`).catch(err => {
          const errorMsg = err.response?.data?.msg || err.message || 'Unknown error';
          console.error(`Failed to delete product ${id}:`, errorMsg);
          return Promise.reject({ id, error: errorMsg });
        }))
      );
      
      const failed = results.filter(r => r.status === 'rejected');
      const success = results.filter(r => r.status === 'fulfilled').length;
      
      setRowSelection({});
      await fetchData();
      
      if (failed.length > 0) {
        const errorMessages = failed.map((f: any) => {
          const reason = f.reason;
          if (reason?.error) return reason.error;
          if (reason?.response?.data?.msg) return reason.response.data.msg;
          if (reason?.message) return reason.message;
          return 'Unknown error';
        });
        const uniqueErrors = [...new Set(errorMessages)].slice(0, 3);
        addToast({ 
          variant: 'warning', 
          message: `Berhasil menghapus ${success} produk. ${failed.length} produk gagal: ${uniqueErrors.join(', ')}${failed.length > 3 ? '...' : ''}` 
        });
      } else {
        addToast({ variant: 'success', message: `Berhasil menghapus ${success} produk.` });
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      addToast({ variant: 'error', message: err.response?.data?.msg || "Terjadi kesalahan saat menghapus produk" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      setUploading(true);
      await api.post(`/produk/upload/${uploadWarehouse}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUploadModal(false);
      setUploadFile(null);
      await fetchData();
      addToast({ variant: 'success', message: 'Upload berhasil!' });
    } catch (err: any) {
      addToast({ variant: 'error', message: err.response?.data?.msg || 'Gagal upload file' });
    } finally {
      setUploading(false);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <IndeterminateCheckbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 50,
    },
    {
      accessorKey: 'pcode',
      header: 'Kode',
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
      meta: { isNumeric: true },
    },
    {
      header: 'Rincian Produk',
      id: 'rincian_produk_group',
      meta: { isNumeric: false },
      columns: [
        {
          accessorKey: 'nama_barang',
          header: 'Nama Produk',
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || ''));
          },
          meta: { isNumeric: false },
        },
        {
          accessorKey: 'kode_divisi',
          header: 'Divisi',
          cell: ({ row }) => row.original.kode_divisi || row.original.nama_divisi_sales || '-',
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            const value = row.original.kode_divisi || row.original.nama_divisi_sales || '-';
            return filterValue.includes(String(value));
          },
          meta: { isNumeric: true },
        },
        {
          accessorKey: 'nomor_rak',
          header: 'Rak',
          cell: ({ row }) => row.getValue('nomor_rak') || '-',
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || '-'));
          },
          meta: { isNumeric: true },
        },
        {
          accessorKey: 'barcode',
          header: 'Barcode',
          cell: ({ row }) => row.getValue('barcode') || '-',
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || '-'));
          },
          meta: { isNumeric: true },
        },
      ]
    },
    {
      header: activeTab === 'wh01' ? 'Stok WH01 (Utama)' : activeTab === 'wh02' ? 'Stok WH02 (BS)' : 'Stok WH03 (Promo)',
      id: 'stok_warehouse_group',
      meta: { isNumeric: true },
      columns: activeTab === 'wh01' ? [
        { 
          accessorKey: 'sistem_karton', 
          header: 'Karton', 
          cell: ({ row }) => {
            const value = row.getValue('sistem_karton');
            return Math.floor(parseFloat(String(value || 0)));
          },
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            const value = row.getValue(columnId);
            return filterValue.includes(String(Math.floor(parseFloat(String(value || 0)))));
          },
          meta: { isNumeric: true },
        },
        { 
          accessorKey: 'sistem_tengah', 
          header: 'Tengah', 
          cell: ({ row }) => {
            const value = row.getValue('sistem_tengah');
            return Math.floor(parseFloat(String(value || 0)));
          },
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            const value = row.getValue(columnId);
            return filterValue.includes(String(Math.floor(parseFloat(String(value || 0)))));
          },
          meta: { isNumeric: true },
        },
        { 
          accessorKey: 'sistem_pieces', 
          header: 'Pieces', 
          cell: ({ row }) => {
            const value = row.getValue('sistem_pieces');
            return Math.floor(parseFloat(String(value || 0)));
          },
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            const value = row.getValue(columnId);
            return filterValue.includes(String(Math.floor(parseFloat(String(value || 0)))));
          },
          meta: { isNumeric: true },
        },
      ] : [
        { 
          accessorKey: activeTab === 'wh02' ? 'sistem_total_pcs_bs' : 'sistem_total_pcs_promo', 
          header: 'Total PCS', 
          cell: ({ row }) => row.getValue(activeTab === 'wh02' ? 'sistem_total_pcs_bs' : 'sistem_total_pcs_promo') || 0,
          enableColumnFilter: true,
          filterFn: (row, columnId, filterValue) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || 0));
          },
          meta: { isNumeric: true },
        },
      ]
    },
    {
      accessorKey: 'total_in_pcs',
      header: 'TOTAL IN PCS',
      cell: ({ row }) => {
        const total = row.getValue('total_in_pcs') || 0;
        return (
          <div className="text-center font-semibold text-blue-600 dark:text-blue-400">
            {Math.floor(parseFloat(String(total))).toLocaleString()}
          </div>
        );
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || 0));
      },
      meta: { isNumeric: true },
    },
    {
      accessorKey: 'hje_per_karton',
      header: 'HJE/KARTON',
      cell: ({ row }) => {
        const harga = row.getValue('hje_per_karton');
        if (!harga || harga === 0) return <div className="text-center text-gray-400">-</div>;
        return (
          <div className="text-center font-medium text-green-600 dark:text-green-400">
            Rp {Number(harga).toLocaleString('id-ID')}
          </div>
        );
      },
      enableColumnFilter: false,
      meta: { isNumeric: true },
    },
    {
      id: 'actions',
      header: 'Aksi',
      meta: { isNumeric: true },
      cell: ({ row }) => {
        const product = row.original;
        const isDeleting = deleting === product.produk_id;
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => handleEdit(product)} 
              className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
              disabled={isDeleting}
            >
              <Edit className="h-4 w-4" />
            </button>
            <button 
              onClick={() => handleDelete(product)} 
              className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [router, deleting, activeTab]);

  const table = useReactTable({
    data: filteredProducts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  });

  // Auto scroll to top on pagination change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [table.getState().pagination.pageIndex]);

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20"><AlertTriangle className="inline h-5 w-5 mr-2" />{error}</div>;

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Edit Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
          <div className="bg-white dark:bg-boxdark rounded-lg p-6 max-w-3xl w-full mx-4 my-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-black dark:text-white">Edit Produk</h3>
                <p className="text-sm text-bodydark mt-1">PCode: {editingProduct.pcode}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-bodydark hover:text-black dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Nama Barang */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.nama_barang}
                  onChange={(e) => setEditFormData({ ...editFormData, nama_barang: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                  placeholder="Masukkan nama barang"
                />
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">Barcode</label>
                <input
                  type="text"
                  value={editFormData.barcode}
                  onChange={(e) => setEditFormData({ ...editFormData, barcode: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                  placeholder="Masukkan barcode"
                />
              </div>

              {/* Divisi */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Divisi <span className="text-red-500">*</span>
                </label>
                <select
                  value={editFormData.divisi_id}
                  onChange={(e) => setEditFormData({ ...editFormData, divisi_id: e.target.value })}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                >
                  <option value="">Pilih Divisi</option>
                  {divisiList.map((div) => (
                    <option key={div.divisi_id} value={div.divisi_id}>
                      {div.nama_divisi} ({div.kode_divisi})
                    </option>
                  ))}
                </select>
              </div>

              {/* WH01 Section */}
              <div className="border-t border-stroke dark:border-strokedark pt-4">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-3">Stok WH01</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Karton</label>
                    <input
                      type="number"
                      value={editFormData.sistem_karton}
                      onChange={(e) => setEditFormData({ ...editFormData, sistem_karton: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Tengah</label>
                    <input
                      type="number"
                      value={editFormData.sistem_tengah}
                      onChange={(e) => setEditFormData({ ...editFormData, sistem_tengah: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Pieces</label>
                    <input
                      type="number"
                      value={editFormData.sistem_pieces}
                      onChange={(e) => setEditFormData({ ...editFormData, sistem_pieces: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Expired Date</label>
                    <input
                      type="date"
                      value={editFormData.expired_date}
                      onChange={(e) => setEditFormData({ ...editFormData, expired_date: e.target.value })}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black dark:text-white mb-2">Rak</label>
                    <select
                      value={editFormData.rak_id}
                      onChange={(e) => setEditFormData({ ...editFormData, rak_id: e.target.value })}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                    >
                      <option value="">Pilih Rak</option>
                      {rakList.map((rak) => (
                        <option key={rak.rak_id} value={rak.rak_id}>
                          {rak.nomor_rak}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* WH02 Section */}
              <div className="border-t border-stroke dark:border-strokedark pt-4">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-3">Stok WH02 (BS)</h4>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Total PCS</label>
                  <input
                    type="number"
                    value={editFormData.sistem_total_pcs_bs}
                    onChange={(e) => setEditFormData({ ...editFormData, sistem_total_pcs_bs: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                  />
                </div>
              </div>

              {/* WH03 Section */}
              <div className="border-t border-stroke dark:border-strokedark pt-4">
                <h4 className="text-sm font-semibold text-black dark:text-white mb-3">Stok WH03 (Promo)</h4>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-white mb-2">Total PCS</label>
                  <input
                    type="number"
                    value={editFormData.sistem_total_pcs_promo}
                    onChange={(e) => setEditFormData({ ...editFormData, sistem_total_pcs_promo: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-stroke dark:border-strokedark">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="px-5 py-2.5 border border-stroke rounded-lg hover:bg-gray-2 dark:border-strokedark dark:text-white"
                disabled={saving}
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                disabled={saving || !editFormData.nama_barang || !editFormData.divisi_id}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-boxdark rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Konfirmasi Hapus</h3>
            <p className="text-sm text-bodydark mb-6">
              Yakin ingin menghapus produk <strong>{productToDelete?.nama_barang}</strong>?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="px-4 py-2 border border-stroke rounded-lg hover:bg-gray-2 dark:border-strokedark dark:text-white"
                disabled={deleting !== null}
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                disabled={deleting !== null}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Excel Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-boxdark rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-white">Upload Excel Produk</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-bodydark hover:text-black dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">⚠️ Penting!</p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Setiap warehouse memiliki produk yang berbeda. Pilih warehouse tujuan dengan hati-hati.
                  Data yang diupload akan masuk ke <strong>{uploadWarehouse.toUpperCase()}</strong> dan produk akan ditandai aktif di warehouse tersebut.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-3">Warehouse Tujuan Upload</label>
                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setUploadWarehouse('wh01')} 
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      uploadWarehouse === 'wh01' 
                        ? 'bg-primary text-white border-primary shadow-lg' 
                        : 'border-stroke dark:border-strokedark dark:text-white hover:border-primary'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">WH01</div>
                      <div className="text-xs mt-1">Warehouse Utama</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setUploadWarehouse('wh02')} 
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      uploadWarehouse === 'wh02' 
                        ? 'bg-primary text-white border-primary shadow-lg' 
                        : 'border-stroke dark:border-strokedark dark:text-white hover:border-primary'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">WH02</div>
                      <div className="text-xs mt-1">BS</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => setUploadWarehouse('wh03')} 
                    className={`px-4 py-3 rounded-lg border-2 transition ${
                      uploadWarehouse === 'wh03' 
                        ? 'bg-primary text-white border-primary shadow-lg' 
                        : 'border-stroke dark:border-strokedark dark:text-white hover:border-primary'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-semibold">WH03</div>
                      <div className="text-xs mt-1">Promo</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">File Excel</label>
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm dark:border-strokedark dark:text-white"
                />
                {uploadFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ File terpilih: {uploadFile.name}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  📋 Format Excel untuk {uploadWarehouse.toUpperCase()}:
                </p>
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  {uploadWarehouse === 'wh01' && (
                    <>
                      <p><strong>Kolom Wajib:</strong> PCode, Nama Barang, Kode Divisi</p>
                      <p><strong>Kolom Stok:</strong> Karton, Tengah, Pieces</p>
                      <p><strong>Kolom Tambahan:</strong> Expired Date, Barcode, Rak</p>
                      <p className="text-[10px] mt-2 text-blue-600 dark:text-blue-400">
                        * Produk yang di-upload akan aktif di WH01, produk lain di WH01 akan non-aktif
                      </p>
                    </>
                  )}
                  {(uploadWarehouse === 'wh02' || uploadWarehouse === 'wh03') && (
                    <>
                      <p><strong>Kolom Wajib:</strong> PCode, Nama Barang, Kode Divisi</p>
                      <p><strong>Kolom Stok:</strong> Total PCS</p>
                      <p><strong>Kolom Tambahan:</strong> Barcode</p>
                      <p className="text-[10px] mt-2 text-blue-600 dark:text-blue-400">
                        * Produk yang di-upload akan aktif di {uploadWarehouse.toUpperCase()}, produk lain di {uploadWarehouse.toUpperCase()} akan non-aktif
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => setShowUploadModal(false)} 
                  className="px-5 py-2.5 border border-stroke rounded-lg hover:bg-gray-2 dark:border-strokedark dark:text-white"
                  disabled={uploading}
                >
                  Batal
                </button>
                <button 
                  onClick={handleUpload} 
                  className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
                  disabled={!uploadFile || uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload ke {uploadWarehouse.toUpperCase()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Manajemen Produk</h1>
          <p className="mt-2 text-sm text-bodydark1">
            Kelola master data produk inventory - {activeTab === 'wh01' ? 'WH01 Utama' : activeTab === 'wh02' ? 'WH02 BS' : 'WH03 Promo'}
          </p>
        </div>
      </div>

      {/* Warehouse Tabs */}
      <div className="mb-5 border-b border-stroke dark:border-strokedark">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('wh01')}
            className={`relative pb-3 text-sm font-medium transition-all ${
              activeTab === 'wh01'
                ? 'text-primary border-b-2 border-primary'
                : 'text-bodydark hover:text-black dark:hover:text-white'
            }`}
          >
            WH01 - Utama
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {products.filter(p => p.is_active_wh01 === 1).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wh02')}
            className={`relative pb-3 text-sm font-medium transition-all ${
              activeTab === 'wh02'
                ? 'text-primary border-b-2 border-primary'
                : 'text-bodydark hover:text-black dark:hover:text-white'
            }`}
          >
            WH02 - BS
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {products.filter(p => p.is_active_wh02 === 1).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wh03')}
            className={`relative pb-3 text-sm font-medium transition-all ${
              activeTab === 'wh03'
                ? 'text-primary border-b-2 border-primary'
                : 'text-bodydark hover:text-black dark:hover:text-white'
            }`}
          >
            WH03 - Promo
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {products.filter(p => p.is_active_wh03 === 1).length}
            </span>
          </button>
        </div>
      </div>

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
          {selectedCount > 0 && (
            <button 
              onClick={handleDeleteSelected} 
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
              Hapus Terpilih ({selectedCount})
            </button>
          )}
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh (R)"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => setShowUploadModal(true)} 
            className="flex items-center gap-2 rounded-lg border border-stroke bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Upload className="h-4 w-4" />Upload Excel
          </button>
          <Link href="/produk/baru"><button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Tambah Produk</button></Link>
        </div>
      </div>

      <div className="rounded-xl border border-stroke bg-white overflow-hidden shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100 text-xs font-semibold uppercase text-gray-700 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-stroke dark:border-strokedark">
                  {headerGroup.headers.map((header) => {
                    const rowSpan = header.subHeaders.length === 0 ? table.getHeaderGroups().length - header.depth : 1;
                    return (
                      <th 
                        key={header.id} 
                        colSpan={header.colSpan} 
                        rowSpan={rowSpan > 1 ? rowSpan : undefined} 
                        className={`px-2 py-3 relative align-middle ${header.depth > 1 || header.colSpan > 1 ? 'text-center' : 'text-left'}`}
                      >
                        {header.isPlaceholder ? null : (
                          <div className={`flex items-center gap-2 ${(header.colSpan > 1 || header.depth > 1) ? 'justify-center' : 'text-left'}`}>
                            <span className="text-sm font-semibold text-black dark:text-white">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            {header.column.getCanFilter() && (
                              <MultiSelectFilter column={header.column} table={table} />
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={100} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-bodydark mb-2" />
                    <p className="text-bodydark">Tidak ada data produk</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <tr 
                    key={row.id} 
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td 
                        key={cell.id} 
                        className={`px-2 py-3 text-sm text-gray-900 dark:text-gray-200 ${
                          (cell.column.columnDef.meta as any)?.isNumeric ? 'text-center' : 'text-left'
                        }`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
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
            <button onClick={() => { table.setPageIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">First</button>
            <button onClick={() => { table.previousPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={!table.getCanPreviousPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">Previous</button>
            <span className="px-3 py-1 text-sm text-bodydark">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button onClick={() => { table.nextPage(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={!table.getCanNextPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">Next</button>
            <button onClick={() => { table.setPageIndex(table.getPageCount() - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={!table.getCanNextPage()} className="rounded-lg border border-stroke px-3 py-1 text-sm disabled:opacity-50 dark:border-strokedark dark:text-white">Last</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProdukPage);
