"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect, ReactNode, MouseEvent, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, AlertTriangle, ArrowLeft, Check, X, 
  CheckCircle, User, Calendar, Package, Warehouse, UserCheck,
  ChevronDown, Search, Filter, RefreshCw,
  Briefcase, TrendingUp
} from 'lucide-react';
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

// --- COMPONENTS KECIL (Badge, StatCard, Filter) ---

// 1. Badge Component
const Badge = ({ variant, children }: any) => {
  const colors: any = {
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[variant] || colors.default}`}>
      {children}
    </span>
  );
};

// 2. StatCard Component
const StatCard = ({ title, value, unit, icon: Icon, colorClass }: any) => (
  <div className="rounded-xl border border-stroke bg-white p-4 shadow-sm dark:border-strokedark dark:bg-boxdark flex items-center gap-4">
    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorClass}`}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <div>
      <h4 className="text-lg font-bold text-black dark:text-white">{value}</h4>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      {unit && <span className="text-[10px] text-gray-400">{unit}</span>}
    </div>
  </div>
);

// 3. Multi-Select Filter Component
const MultiSelectFilter = ({ column, title, table }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('value');
  const [sortOrder, setSortOrder] = useState('asc');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const positionedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const columnFilterValue = column.getFilterValue() || [];
  const uniqueValues = useMemo(() => {
    const values = new Set();
    const columnId = column.id;
    const allRows = table.getPreFilteredRowModel().rows;
    allRows.forEach((row: any) => {
      const value = row.getValue(columnId);
      const stringValue = String(value !== null && value !== undefined && value !== '' ? value : ((column.columnDef.meta as any)?.isNumeric ? '0' : '(Empty)'));
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

  const applyFilter = () => { setIsOpen(false); };
  
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
      positionedRef.current = false;
    }
    setIsOpen(!isOpen);
  };

  useLayoutEffect(() => {
    if (isOpen && dropdownRef.current && !positionedRef.current) {
      const dropdown = dropdownRef.current;
      const rect = dropdown.getBoundingClientRect();
      let newTop = position.top;
      let newLeft = position.left;
      
      if (rect.right > window.innerWidth - 10) {
        newLeft = window.innerWidth - rect.width - 10;
      }
      if (newLeft < 10) { newLeft = 10; }
      if (rect.bottom > window.innerHeight - 10) {
        newTop = window.innerHeight - rect.height - 10;
      }
      if (newTop < 10) { newTop = 10; }
      
      if (newTop !== position.top || newLeft !== position.left) {
        setPosition({ top: newTop, left: newLeft });
      }
      positionedRef.current = true;
    } else if (!isOpen) {
      positionedRef.current = false;
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
        className="fixed z-50 min-w-[280px] w-max max-w-[400px] max-h-[500px] flex flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" 
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button onClick={() => setSortOrder('asc')} className={`flex-1 px-4 py-2 text-xs font-medium transition ${sortOrder === 'asc' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>↑ Ascending</button>
          <button onClick={() => setSortOrder('desc')} className={`flex-1 px-4 py-2 text-xs font-medium transition ${sortOrder === 'desc' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>↓ Descending</button>
        </div>
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-900">
          <button onClick={() => setActiveTab('condition')} className={`flex-1 px-4 py-2 text-xs font-medium transition ${activeTab === 'condition' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>Filter by Condition</button>
          <button onClick={() => setActiveTab('value')} className={`flex-1 px-4 py-2 text-xs font-medium transition ${activeTab === 'value' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}`}>Filter by Value</button>
        </div>
        {activeTab === 'value' && (
          <div>
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
          </div>
        )}
        {activeTab === 'condition' && (
          <div className="p-4 flex-1 min-h-0 overflow-y-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Filter by condition (Coming soon)</p>
          </div>
        )}
        <div className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-700 flex-shrink-0">
          <button onClick={clearAll} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Clear</button>
          <button onClick={applyFilter} className="flex-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90">Apply</button>
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

// Tipe untuk koordinat sel
type CellCoords = { row: number; col: number } | null;

// ✅ GLOBAL FILTER FUNCTION (Di luar component agar tidak re-render)
const numericFilterFn = (row: any, columnId: string, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true;
  const rowValue = String(row.getValue(columnId) || 0);
  return filterValue.includes(rowValue);
};

// --- MAIN COMPONENT ---

function DetailOpnamePage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.assignment_id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignmentInfo, setAssignmentInfo] = useState<any>({});
  const [details, setDetails] = useState<any[]>([]);
  
  // Table Logic States
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [selectionStart, setSelectionStart] = useState<CellCoords>(null);
  const [selectionEnd, setSelectionEnd] = useState<CellCoords>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [activeCell, setActiveCell] = useState<CellCoords>(null);

  // ✅ PERBAIKAN: Pakai useCallback untuk fetchData
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/opname/assignment/${assignmentId}`);
      setAssignmentInfo(res.data.assignment || {});
      setDetails(res.data.details || []);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Gagal memuat data opname.");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  // ✅ PERBAIKAN: Masukkan fetchData ke dependency array
  useEffect(() => {
    if (assignmentId) fetchData();
  }, [assignmentId, fetchData]);

  // Keyboard Shortcut Refresh
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (isInputFocused || target.isContentEditable || loading) return;
      
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        fetchData();
      }
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [loading, fetchData]); // Tambahkan fetchData di sini juga

  // --- PROCESSED DATA ---
  const data = useMemo(() => {
    return details.map((item: any) => {
      const sysK = item.sistem_karton || 0;
      const sysT = item.sistem_tengah || 0;
      const sysP = item.sistem_pieces || 0;
      const fisK = item.fisik_karton;
      const fisT = item.fisik_tengah;
      const fisP = item.fisik_pieces;
      const isFisikEmpty = fisK === null && fisT === null && fisP === null;
      let status_display = 'Pending';
      let hasSelisih = false;
      
      if (!isFisikEmpty) {
        const fisKValue = fisK ?? 0;
        const fisTValue = fisT ?? 0;
        const fisPValue = fisP ?? 0;
        hasSelisih = (sysK !== fisKValue) || (sysT !== fisTValue) || (sysP !== fisPValue);
        status_display = hasSelisih ? 'Selisih' : 'Sesuai';
      }
      
      return {
        ...item,
        kode_produk: item.kode_produk || item.pcode || '-',
        nama_produk: item.nama_produk || item.nama_barang || '-',
        nomor_rak: item.nomor_rak || item.rak || '-',
        expired_date: item.expired_date,
        sistem_karton: sysK,
        sistem_tengah: sysT,
        sistem_pieces: sysP,
        fisik_karton: fisK,
        fisik_tengah: fisT,
        fisik_pieces: fisP,
        status_display,
        hasSelisih,
        isPending: isFisikEmpty,
      };
    });
  }, [details]);

  // --- STATISTICS ---
  const statistics = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalProduk: 0, statusPending: 0, statusSesuai: 0, statusSelisih: 0,
        totalSistemKarton: 0, totalFisikKarton: 0, selisihKarton: 0,
      };
    }

    let pending = 0, sesuai = 0, selisih = 0;
    let sisK = 0, fisK = 0;

    data.forEach((item: any) => {
      if (item.isPending) pending++;
      else if (item.hasSelisih) selisih++;
      else sesuai++;
      sisK += item.sistem_karton || 0;
      if (!item.isPending) {
        fisK += item.fisik_karton || 0;
      }
    });

    return {
      totalProduk: data.length, statusPending: pending, statusSesuai: sesuai, statusSelisih: selisih,
      totalSistemKarton: sisK, totalFisikKarton: fisK, selisihKarton: sisK - fisK,
    };
  }, [data]);

  // --- COLUMNS DEFINITION ---
  const columns = useMemo(() => ([
    {
      header: 'Rincian Produk',
      id: 'rincian_produk_main_group',
      meta: { isNumeric: false },
      columns: [
        {
          id: 'nomor',
          header: 'No.',
          cell: ({ row, table }: { row: Row<any>, table: any }) => {
            const paginatedRows = table.getPaginationRowModel().rows;
            const rowIndex = paginatedRows.findIndex((paginatedRow: Row<any>) => paginatedRow.id === row.id);
            return rowIndex + 1;
          },
          enableSorting: false,
          enableColumnFilter: false, 
          meta: { isNumeric: false },
        },
        {
          accessorKey: 'kode_produk',
          header: 'Kode Produk',
          enableColumnFilter: true,
          filterFn: (row: any, columnId: string, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || '-'));
          },
          meta: { isNumeric: false },
        },
        {
          accessorKey: 'nama_produk',
          header: 'Nama Produk',
          enableColumnFilter: true,
          filterFn: (row: any, columnId: string, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || '-'));
          },
          meta: { isNumeric: false },
        },
        {
          accessorKey: 'nomor_rak',
          header: 'Rak',
          enableColumnFilter: true,
          filterFn: (row: any, columnId: string, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || '-'));
          },
          meta: { isNumeric: false },
        },
      ]
    },
    {
      header: 'Qty System',
      id: 'qty_system_group',
      meta: { isNumeric: true },
      columns: [
        { 
          accessorKey: 'sistem_karton', header: 'Karton', 
          enableColumnFilter: true, filterFn: numericFilterFn, meta: { isNumeric: true },
        },
        { 
          accessorKey: 'sistem_tengah', header: 'Tengah', 
          enableColumnFilter: true, filterFn: numericFilterFn, meta: { isNumeric: true },
        },
        { 
          accessorKey: 'sistem_pieces', header: 'Pieces', 
          enableColumnFilter: true, filterFn: numericFilterFn, meta: { isNumeric: true },
        },
      ]
    },
    {
      header: 'Qty Fisik',
      id: 'qty_fisik_group',
      meta: { isNumeric: true },
      columns: [
        { 
          accessorKey: 'fisik_karton', header: 'Karton', 
          enableColumnFilter: true, filterFn: numericFilterFn, meta: { isNumeric: true },
          cell: (info: any) => info.getValue() ?? <span className="text-gray-400 italic">-</span>
        },
        { 
          accessorKey: 'fisik_tengah', header: 'Tengah', 
          enableColumnFilter: true, filterFn: numericFilterFn, meta: { isNumeric: true },
          cell: (info: any) => info.getValue() ?? <span className="text-gray-400 italic">-</span>
        },
        { 
          accessorKey: 'fisik_pieces', header: 'Pieces', 
          enableColumnFilter: true, filterFn: numericFilterFn, meta: { isNumeric: true },
          cell: (info: any) => info.getValue() ?? <span className="text-gray-400 italic">-</span>
        },
        {
          accessorKey: 'expired_date',
          header: 'Exp Date',
          enableColumnFilter: true,
          filterFn: (row: any, columnId: string, filterValue: string[]) => {
            if (!filterValue || filterValue.length === 0) return true;
            return filterValue.includes(String(row.getValue(columnId) || '-'));
          },
          cell: (info: any) => {
            const value = info.getValue();
            if (!value || value === '-') return <span className="text-gray-400">-</span>;
            try {
              return <span className="text-sm">{new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>;
            } catch { return value; }
          },
          meta: { isNumeric: false },
        },
      ]
    },
    {
      accessorKey: 'status_display',
      header: 'Status',
      enableColumnFilter: true,
      filterFn: (row: any, columnId: string, filterValue: string[]) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(row.getValue(columnId));
      },
      cell: ({ row }: any) => {
        const status = row.getValue('status_display');
        let variant = 'default';
        if (status === 'Pending') variant = 'warning';
        else if (status === 'Selisih') variant = 'danger';
        else if (status === 'Sesuai') variant = 'success';
        return <Badge variant={variant}>{status}</Badge>;
      },
      meta: { isNumeric: false },
    },
  ]), []); 

  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  // --- TABLE INTERACTION LOGIC (Selection, Copy, Keyboard) ---
  const getIsCellSelected = (currentRowIndex: number, currentColIndex: number) => {
    if (!selectionStart || !selectionEnd) return false;
    const minRow = Math.min(selectionStart.row, selectionEnd.row);
    const maxRow = Math.max(selectionStart.row, selectionEnd.row);
    const minCol = Math.min(selectionStart.col, selectionEnd.col);
    const maxCol = Math.max(selectionStart.col, selectionEnd.col);
    return (currentRowIndex >= minRow && currentRowIndex <= maxRow && currentColIndex >= minCol && currentColIndex <= maxCol);
  };

  useEffect(() => {
    const handleCopy = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'c' && !isSelecting) {
        if (!selectionStart || !selectionEnd) return;
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
              if (value === null || value === undefined) value = '';
              rowData.push(String(value));
            }
          }
          dataToCopy.push(rowData.join('\t')); 
        }
        navigator.clipboard.writeText(dataToCopy.join('\n')).catch(console.error);
      }
    };
    document.addEventListener('keydown', handleCopy);
    return () => document.removeEventListener('keydown', handleCopy);
  }, [table, selectionStart, selectionEnd, isSelecting]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tableContainerRef.current && !tableContainerRef.current.contains(event.target as Node)) {
        setSelectionStart(null); setSelectionEnd(null); setActiveCell(null);
      }
    }
    const doc = document;
    doc.addEventListener('mousedown', handleClickOutside as any);
    return () => doc.removeEventListener('mousedown', handleClickOutside as any);
  }, [tableContainerRef]);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeCell) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          const newActiveCell = { row: 0, col: 0 };
          setActiveCell(newActiveCell); setSelectionStart(newActiveCell); setSelectionEnd(newActiveCell);
        }
        return;
      }
      const { row: r, col: c } = activeCell;
      let newRow = r, newCol = c;
      switch (event.key) {
        case 'ArrowUp': newRow = Math.max(0, r - 1); break;
        case 'ArrowDown': newRow = Math.min(table.getRowModel().rows.length - 1, r + 1); break;
        case 'ArrowLeft': newCol = Math.max(0, c - 1); break;
        case 'ArrowRight': newCol = Math.min(table.getAllLeafColumns().length - 1, c + 1); break;
        default: return;
      }
      event.preventDefault();
      const newActiveCell = { row: newRow, col: newCol };
      setActiveCell(newActiveCell);
      if (event.shiftKey) setSelectionEnd(newActiveCell);
      else { setSelectionStart(newActiveCell); setSelectionEnd(newActiveCell); }
    };
    container.setAttribute('tabIndex', '-1');
    container.addEventListener('keydown', handleKeyDown);
    const handleFocus = () => container.focus({ preventScroll: true });
    container.addEventListener('mousedown', handleFocus);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('mousedown', handleFocus);
    };
  }, [activeCell, table]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="rounded-lg border border-red-400 bg-red-100 p-4 text-red-700"><AlertTriangle className="inline h-5 w-5 mr-2" />{error}</div>;

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/riwayat" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary dark:text-gray-400">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Riwayat
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Detail Riwayat Opname</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">View only - Riwayat hasil penghitungan stok gudang</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* INFO GRID */}
      <div className="glass-card p-6 rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Petugas</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{assignmentInfo.nama_user || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Divisi</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{assignmentInfo.divisi_lengkap || assignmentInfo.kode_divisi || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Warehouse className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Gudang</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{assignmentInfo.nama_gudang || assignmentInfo.tipe_opname || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Batch</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{assignmentInfo.nama_batch || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <div className="mt-1">
                <Badge variant={
                  assignmentInfo.status_assignment === 'Submitted' ? 'warning' : 
                  assignmentInfo.status_assignment === 'Approved' ? 'success' : 
                  assignmentInfo.status_assignment === 'Rejected' ? 'danger' : 'default'
                }>
                  {assignmentInfo.status_assignment || 'Pending'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Tanggal Opname</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                {assignmentInfo.submitted_at ? new Date(assignmentInfo.submitted_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 
                 assignmentInfo.assigned_at ? new Date(assignmentInfo.assigned_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* STATISTIK CARDS (DARI PAGE_NEW.TSX) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Item" 
          value={statistics.totalProduk} 
          unit="Produk"
          colorClass="bg-purple-600"
          icon={Package} 
        />
        <StatCard 
          title="Total Fisik Karton" 
          value={statistics.totalFisikKarton} 
          unit="Karton"
          colorClass="bg-green-600"
          icon={CheckCircle} 
        />
        <StatCard 
          title="Selisih Karton" 
          value={Math.abs(statistics.selisihKarton)} 
          unit={statistics.selisihKarton > 0 ? "Kurang (Hilang)" : statistics.selisihKarton < 0 ? "Lebih (Surplus)" : "Sesuai"}
          colorClass={statistics.selisihKarton !== 0 ? "bg-red-600" : "bg-blue-600"}
          icon={TrendingUp} 
        />
        <StatCard 
          title="Item Selisih" 
          value={statistics.statusSelisih} 
          unit={`Dari ${statistics.totalProduk} Item`}
          colorClass={statistics.statusSelisih > 0 ? "bg-orange-500" : "bg-blue-500"}
          icon={AlertTriangle} 
        />
      </div>

      {/* TABLE UTAMA */}
      <div 
        ref={tableContainerRef} 
        className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark outline-none overflow-hidden w-full"
        onMouseUp={() => { if (isSelecting) setIsSelecting(false); }}
        onMouseLeave={() => { if (isSelecting) setIsSelecting(false); }}
      >
        <div className="w-full overflow-x-auto">
          <table className={`w-full text-left text-sm table-auto min-w-full ${isSelecting ? 'select-none' : ''}`}>
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100 text-xs font-semibold uppercase text-gray-700 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const rowSpan = header.subHeaders.length === 0 ? table.getHeaderGroups().length - header.depth : 1;
                    return (
                      <th 
                        key={header.id} 
                        colSpan={header.colSpan} 
                        rowSpan={rowSpan > 1 ? rowSpan : undefined} 
                        className={`px-2 py-3 relative align-middle ${header.depth > 1 || header.colSpan > 1 ? 'text-center' : ''}`}
                      >
                        {header.isPlaceholder ? null : (
                          <div className={`flex items-center gap-2 ${(header.colSpan > 1 || header.depth > 1) ? 'justify-center' : 'text-left'}`}>
                            <div onClick={header.column.getToggleSortingHandler()} className={`${header.column.getCanSort() ? 'cursor-pointer select-none flex items-center gap-1' : ''}`}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getIsSorted() && <span className="text-primary">{header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}</span>}
                            </div>
                            {header.column.getCanFilter() && header.id !== 'nomor' && (
                              <MultiSelectFilter column={header.column} title={header.column.columnDef.header} table={table} />
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
              {table.getRowModel().rows.map((row, i) => (
                <tr key={row.id} className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                  {row.getVisibleCells().map((cell) => {
                    const columnId = cell.column.id;
                    const rowIndex = row.index;
                    const colIndex = cell.column.getIndex();
                    const cellIsSelected = getIsCellSelected(rowIndex, colIndex);
                    let borderClass = '';
                    if (columnId === 'sistem_karton' || columnId === 'fisik_karton' || columnId === 'status_display') borderClass = 'border-l border-gray-200 dark:border-gray-700';
                    
                    return (
                      <td 
                        key={cell.id} id={`cell-${rowIndex}-${colIndex}`}
                        className={`px-2 py-3 text-gray-900 dark:text-gray-200 relative text-center ${borderClass} ${cellIsSelected ? 'bg-primary/20 dark:bg-primary/30' : ''} cursor-cell whitespace-nowrap`}
                        onMouseDown={() => {
                          setIsSelecting(true); const coords = { row: rowIndex, col: colIndex };
                          setSelectionStart(coords); setSelectionEnd(coords); setActiveCell(coords);
                        }}
                        onMouseOver={() => { if (isSelecting) setSelectionEnd({ row: rowIndex, col: colIndex }); }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show</span>
            <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              {[10, 25, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
             <span className="text-sm text-gray-700 dark:text-gray-300">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
             <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(DetailOpnamePage);