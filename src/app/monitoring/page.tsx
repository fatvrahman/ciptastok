"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, Loader2, Search, ClipboardList, AlertTriangle, Trash2, Filter, RefreshCw, Calendar } from 'lucide-react';
import { Alert, useToast, ToastContainer } from '@/components/ui/alert';
import Dialog from '@/components/ui/dialog';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  Row,
  Cell,
} from '@tanstack/react-table';

// Badge Component
const Badge = ({ variant, children }: any) => {
  // ... (Tidak ada perubahan)
  const colors: any = {
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[variant] || colors.default}`}>{children}</span>;
};

// Multi-Select Filter Component
const MultiSelectFilter = ({ column, table }: any) => {
  // ... (Tidak ada perubahan, biarkan seperti aslinya)
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
      setPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
    }
    setIsOpen(!isOpen);
  };

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      let newTop = position.top;
      let newLeft = position.left;
      
      // Cek apakah dropdown keluar dari kanan viewport
      if (rect.right > window.innerWidth - 10) {
        newLeft = window.innerWidth - rect.width - 10;
      }
      
      // Cek apakah dropdown keluar dari kiri viewport
      if (newLeft < 10) {
        newLeft = 10;
      }
      
      // Cek apakah dropdown keluar dari bawah viewport
      if (rect.bottom > window.innerHeight - 10) {
        newTop = window.innerHeight - rect.height - 10;
      }
      
      // Cek apakah dropdown keluar dari atas viewport
      if (newTop < 10) {
        newTop = 10;
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
      <div className="fixed inset-0 z-[9990]" onClick={() => setIsOpen(false)} />
      <div 
        ref={dropdownRef} 
        className="fixed z-[9995] min-w-[280px] w-max max-w-[400px] max-h-[500px] flex flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" 
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
  // ... (Tidak ada perubahan)
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

// Tipe untuk koordinat sel
type CellCoords = { row: number; col: number } | null;

function MonitoringPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();
  
  // Dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // State untuk Cell Selection
  const [selectionStart, setSelectionStart] = useState<CellCoords>(null);
  const [selectionEnd, setSelectionEnd] = useState<CellCoords>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // +++ PERMINTAAN 1: Ref untuk container tabel
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    // ... (Tidak ada perubahan)
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/opname/assignments/active');
      setAssignments(res.data);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Gagal memuat data opname.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Shortcut keyboard 'R' untuk refresh
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Cek apakah sedang fokus di input/textarea/select
      const target = event.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      
      // Cek apakah element memiliki contentEditable
      const isContentEditable = target.isContentEditable;
      
      // Jika sedang di input atau loading, jangan trigger
      if (isInputFocused || isContentEditable || loading) {
        return;
      }
      
      // Trigger refresh saat tekan 'R' atau 'r'
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        fetchData();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [loading]); // Dependency: loading untuk cek status terkini

  const handleDeleteClick = (assignmentId: number, assignmentName: string) => {
    setDeleteTarget({ id: assignmentId, name: assignmentName });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      setDeleting(deleteTarget.id);
      await api.delete(`/opname/assignment/${deleteTarget.id}`);
      addToast({
        variant: 'success',
        message: 'Assignment berhasil dihapus!',
      });
      fetchData();
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.msg || 'Gagal menghapus assignment.',
      });
    } finally {
      setDeleting(null);
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  const handleDeleteSelectedClick = () => {
    const selectedIds = Object.keys(rowSelection).map(index => assignments[parseInt(index)].assignment_id);
    if (selectedIds.length > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  const confirmBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(index => assignments[parseInt(index)].assignment_id);
    
    try {
      setDeleting(-1); // Special value for bulk delete
      const deletePromises = selectedIds.map(id => api.delete(`/opname/assignment/${id}`));
      await Promise.all(deletePromises);
      addToast({
        variant: 'success',
        message: `${selectedIds.length} assignment berhasil dihapus!`,
      });
      setRowSelection({});
      fetchData();
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.msg || 'Gagal menghapus assignment.',
      });
    } finally {
      setDeleting(null);
      setShowBulkDeleteDialog(false);
    }
  };
  
  // +++ PERMINTAAN 1: useEffect untuk clear selection saat klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableContainerRef.current && !tableContainerRef.current.contains(event.target as Node)) {
        // Klik di luar tabel, bersihkan seleksi
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    }
    
    // Tambahkan event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Hapus event listener
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tableContainerRef]); // Dependency

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllRowsSelected()}
          indeterminate={table.getIsSomeRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          className="rounded border-gray-300 text-primary focus:ring-primary"
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    // +++ PERMINTAAN 3: Kolom Nomor
    {
      id: 'nomor',
      header: 'No.',
      cell: ({ row, table }) => {
        // Dapatkan array baris dari model tabel yang sudah dipaginasi
        const paginatedRows = table.getPaginationRowModel().rows;
        // Cari index dari baris saat ini di dalam array tersebut
        const rowIndex = paginatedRows.findIndex(paginatedRow => paginatedRow.id === row.id);
        // Tambah 1 (karena index 0-based)
        return rowIndex + 1;
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: 'nama_batch',
      header: 'Batch',
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      accessorKey: 'pembuat',
      header: 'Pembuat',
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Tanggal',
      // +++ PERMINTAAN 2: Ubah format render tanggal
      cell: ({ row }) => {
        try {
          const date = new Date(row.getValue('created_at'));
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          const y = date.getFullYear().toString().slice(-2);
          return `${d}/${m}/${y}`;
        } catch (e) {
          return 'Invalid Date';
        }
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        try {
          const date = new Date(row.getValue(columnId));
          const d = date.getDate().toString().padStart(2, '0');
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          const y = date.getFullYear().toString().slice(-2);
          const formattedDate = `${d}/${m}/${y}`;
          return filterValue.includes(formattedDate);
        } catch (e) {
          return false;
        }
      },
    },
    {
      accessorKey: 'tipe_opname',
      header: 'Gudang',
      cell: ({ row }) => {
        const tipe = row.getValue('tipe_opname');
        if (tipe === 'WH01') return <Badge variant="purple">WH01</Badge>;
        if (tipe === 'WH02') return <Badge variant="danger">WH02</Badge>;
        if (tipe === 'WH03') return <Badge variant="info">WH03</Badge>;
        return <Badge variant="default">{tipe}</Badge>;
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      accessorKey: 'nama_user',
      header: 'Petugas',
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      accessorKey: 'divisi_lengkap',
      header: 'Divisi',
      cell: ({ row }) => {
        const divisi = row.getValue('divisi_lengkap');
        return divisi || '-';
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || '-'));
      },
    },
    {
      accessorKey: 'status_assignment',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status_assignment');
        if (status === 'Submitted') return <Badge variant="warning">Submitted</Badge>;
        if (status === 'Approved') return <Badge variant="success">Approved</Badge>;
        if (status === 'Rejected') return <Badge variant="danger">Rejected</Badge>;
        if (status === 'In Progress') return <Badge variant="info">In Progress</Badge>;
        if (status === 'Pending') return <Badge variant="warning">Pending</Badge>;
        return <Badge variant="default">{status}</Badge>;
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const assignment = row.original;
        return (
          // +++ PERMINTAAN 4: Tambah justify-center ke div tombol
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={() => router.push(`/monitoring/approve/${assignment.assignment_id}`)} 
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
            >
              <Eye className="h-4 w-4" />
              {assignment.status_assignment === 'Submitted' ? 'Approve' : 'Lihat'}
            </button>
            
            {(assignment.status_assignment === 'Pending' || assignment.status_assignment === 'In Progress') && (
              <button 
                onClick={() => handleDeleteClick(assignment.assignment_id, assignment.nama_batch)}
                disabled={deleting === assignment.assignment_id}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === assignment.assignment_id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Hapus
              </button>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
  ], [router, deleting]); // 'table' tidak perlu di dependency array, tapi router/deleting perlu

  const table = useReactTable({
    data: assignments,
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
        pageSize: 10,
      },
    },
  });
  
  // Helper function untuk mengecek apakah sel terseleksi
  const getIsCellSelected = (currentRowIndex: number, currentColIndex: number) => {
    // ... (Tidak ada perubahan)
    if (!selectionStart || !selectionEnd) return false;

    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);

    return (
      currentRowIndex >= minRow &&
      currentRowIndex <= maxRow &&
      currentColIndex >= minCol &&
      currentColIndex <= maxCol
    );
  };

  // useEffect untuk Copy-Paste
  useEffect(() => {
    const handleCopy = (event: KeyboardEvent) => {
      // ... (Logika 'if' tidak berubah)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !isSelecting) {
        
        if (!selectionStart || !selectionEnd) {
          return;
        }
        
        event.preventDefault();
        
        const minRow = Math.min(selectionStart.row, selectionEnd.row);
        const maxRow = Math.max(selectionStart.row, selectionEnd.row);
        const minCol = Math.min(selectionStart.col, selectionEnd.col);
        const maxCol = Math.max(selectionStart.col, selectionEnd.col);

        const dataToCopy: string[] = [];
        const rows = table.getRowModel().rows;

        for (let i = minRow; i <= maxRow; i++) {
          const row = rows[i];
          if (!row) continue;

          const rowData: any[] = [];
          
          for (let j = minCol; j <= maxCol; j++) {
            const cell = row.getVisibleCells().find(c => c.column.getIndex() === j);
            
            if (cell) {
              let value = cell.getValue(); 
              const colId = cell.column.id;
              
              // +++ PERMINTAAN 2: Modifikasi logika copy tanggal
              if (colId === 'created_at') {
                try {
                  const date = new Date(value as string);
                  const d = date.getDate().toString().padStart(2, '0');
                  const m = (date.getMonth() + 1).toString().padStart(2, '0');
                  const y = date.getFullYear().toString().slice(-2);
                  value = `${d}/${m}/${y}`;
                } catch (e) {
                  value = 'Invalid Date'; // Fallback
                }
              } 
              // +++ PERMINTAAN 3: Pastikan 'nomor' juga tercopy
              else if (colId === 'nomor') {
                 // Dapatkan array baris dari model tabel yang sudah dipaginasi
                 const paginatedRows = table.getPaginationRowModel().rows;
                 // Cari index dari baris saat ini di dalam array tersebut
                 const rowIndex = paginatedRows.findIndex(paginatedRow => paginatedRow.id === row.id);
                 // Tambah 1 (karena index 0-based)
                 value = rowIndex + 1;
              }
              else if (colId === 'tipe_opname' || colId === 'status_assignment') {
                 value = String(value);
              } else if (typeof value === 'object' && value !== null) {
                value = JSON.stringify(value);
              }
              
              rowData.push(value);
            }
          }
          dataToCopy.push(rowData.join('\t')); 
        }
        
        const textToCopy = dataToCopy.join('\n');
        
        navigator.clipboard.writeText(textToCopy)
          .then(() => {})
          .catch(err => {
            console.error('Gagal menyalin data: ', err);
          });
      }
    };

    document.addEventListener('keydown', handleCopy);
    
    return () => {
      document.removeEventListener('keydown', handleCopy);
    };

  }, [table, selectionStart, selectionEnd, isSelecting]); // (Dependencies tidak berubah)


  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20"><AlertTriangle className="inline h-5 w-5 mr-2" />{error}</div>;

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* Delete Dialogs */}
      <Dialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message={`Hapus assignment "${deleteTarget?.name}"? Hanya assignment dengan status Pending/In Progress yang dapat dihapus.`}
        variant="error"
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <Dialog
        isOpen={showBulkDeleteDialog}
        onClose={() => setShowBulkDeleteDialog(false)}
        onConfirm={confirmBulkDelete}
        title="Confirm Bulk Delete"
        message={`Hapus ${Object.keys(rowSelection).length} assignment terpilih? Hanya assignment dengan status Pending/In Progress yang dapat dihapus.`}
        variant="error"
        confirmText="Delete All"
        cancelText="Cancel"
      />
      
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Monitoring Opname</h1>
          <p className="mt-2 text-sm text-bodydark1">Pantau dan verifikasi tugas opname yang sedang berjalan</p>
        </div>
      </div>

      {/* ... (UI Kontrol Atas, tidak berubah) ... */}
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
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh (R)"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {selectedCount > 0 && (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <span>{selectedCount} dipilih</span>
              </div>
              <button 
                onClick={handleDeleteSelectedClick}
                disabled={deleting === -1}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === -1 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Hapus Terpilih
              </button>
            </>
          )}
          <button 
            onClick={() => router.push('/riwayat')} 
            className="flex items-center gap-2 rounded-lg border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark px-4 py-2 text-sm font-medium dark:text-white"
          >
            <Calendar className="h-4 w-4" />
            Riwayat
          </button>
          <Link href="/monitoring/baru">
            <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Buat Opname
            </button>
          </Link>
        </div>
      </div>

      {/* --- Pembungkus tabel dengan event listeners --- */}
      <div 
        // +++ PERMINTAAN 1: Tambahkan ref ke container
        ref={tableContainerRef}
        className="rounded-xl border border-stroke bg-white overflow-hidden w-full shadow-sm dark:border-strokedark dark:bg-boxdark"
        onMouseUp={() => {
          if (isSelecting) {
            setIsSelecting(false);
          }
        }}
        onMouseLeave={() => {
          if (isSelecting) {
            setIsSelecting(false);
          }
        }}
      >
        <div className="w-full overflow-x-auto">
          <table className={`w-full table-auto min-w-full text-sm ${isSelecting ? 'select-none' : ''}`}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left">
                      {/* +++ PERMINTAAN 4: Modifikasi div header untuk 'Aksi' */}
                      <div className={`flex items-center gap-2 ${header.id === 'actions' ? 'justify-center w-full' : ''}`}>
                        <span className="text-xs font-semibold text-black dark:text-white break-words">
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
                    <ClipboardList className="mx-auto h-12 w-12 text-bodydark mb-2" />
                    <p className="text-bodydark">Tidak ada opname aktif</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row, i) => (
                  <tr 
                    key={row.id} 
                    className="border-b border-stroke hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-700 transition-colors"
                  >
                    
                    {row.getVisibleCells().map((cell) => {
                      const rowIndex = row.index;
                      const colIndex = cell.column.getIndex();
                      
                      const cellIsSelected = getIsCellSelected(rowIndex, colIndex);
                      
                      // Pengecualian interaksi untuk 'select' dan 'actions'
                      const isDataCell = cell.column.id !== 'select' && cell.column.id !== 'actions' && cell.column.id !== 'nomor';

                      return (
                        <td 
                          key={cell.id} 
                          className={`
                            px-4 py-3 text-sm text-bodydark dark:text-white whitespace-nowrap
                            ${cellIsSelected ? 'bg-primary/20 dark:bg-primary/30' : ''} 
                            ${isDataCell ? 'cursor-cell' : ''} 
                          `}
                          
                          
                          onMouseDown={isDataCell ? () => {
                            setIsSelecting(true);
                            const coords = { row: rowIndex, col: colIndex };
                            setSelectionStart(coords);
                            setSelectionEnd(coords);
                          } : undefined}
                          
                          onMouseOver={isDataCell ? () => {
                            if (isSelecting) {
                              setSelectionEnd({ row: rowIndex, col: colIndex });
                            }
                          } : undefined}
                        >
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

        {/* ... (Pagination, tidak berubah) ... */}
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

export default withAuth(MonitoringPage);
