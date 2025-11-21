"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, Search, History, AlertTriangle, Calendar, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react';
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

function RiwayatPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/opname/batch');
      // Filter only completed/cancelled batches
      const completedBatches = res.data.filter((b: any) => 
        b.status_overall === 'Completed' || b.status_overall === 'Cancelled'
      );
      setBatches(completedBatches);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Gagal memuat riwayat opname.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'nama_batch',
      header: 'Nama Batch',
      cell: ({ row }) => (
        <span className="font-semibold text-black dark:text-white">{row.getValue('nama_batch')}</span>
      ),
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
      header: 'Tanggal Dibuat',
      cell: ({ row }) => {
        const date = row.getValue('created_at');
        return new Date(date as string).toLocaleDateString('id-ID');
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const date = new Date(row.getValue(columnId) as string).toLocaleDateString('id-ID');
        return filterValue.some((val: string) => date.includes(val));
      },
    },
    {
      accessorKey: 'completed_at',
      header: 'Tanggal Selesai',
      cell: ({ row }) => {
        const date = row.getValue('completed_at');
        return date ? new Date(date as string).toLocaleDateString('id-ID') : '-';
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: 'tipe_opname',
      header: 'Gudang',
      cell: ({ row }) => {
        const tipe = row.getValue('tipe_opname');
        if (tipe === 'WH01') return <Badge variant="purple">WH01</Badge>;
        if (tipe === 'WH02') return <Badge variant="danger">WH02</Badge>;
        if (tipe === 'WH03') return <Badge variant="info">WH03</Badge>;
        return <Badge variant="info">{tipe}</Badge>;
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      accessorKey: 'status_overall',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status_overall');
        if (status === 'Completed') {
          return <Badge variant="success"><CheckCircle className="inline h-3 w-3 mr-1" />Selesai</Badge>;
        }
        if (status === 'Cancelled') {
          return <Badge variant="danger"><XCircle className="inline h-3 w-3 mr-1" />Dibatalkan</Badge>;
        }
        return <Badge variant="info">{status}</Badge>;
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
      cell: ({ row }) => (
        <button 
          onClick={() => router.push(`/riwayat/rincian/${row.original.batch_id}`)} 
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
        >
          <Eye className="h-4 w-4" />
          Detail
        </button>
      ),
      enableColumnFilter: false,
    },
  ], [router]);

  const table = useReactTable({
    data: batches,
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
  if (error) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20"><AlertTriangle className="inline h-5 w-5 mr-2" />{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">Riwayat Opname</h1>
          <p className="mt-2 text-sm text-bodydark1">Daftar stock opname yang telah selesai</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50 dark:text-white"
          title="Refresh (R)"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
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
      </div>

      <div className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-4 text-left">
                      <div className="flex items-center gap-2">
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
                    <History className="mx-auto h-12 w-12 text-bodydark mb-2" />
                    <p className="text-bodydark">Belum ada riwayat opname</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-stroke hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-5 text-sm dark:text-white">
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

export default withAuth(RiwayatPage);
