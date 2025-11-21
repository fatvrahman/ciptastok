"use client";

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { withAuth } from '@/lib/auth';
import { 
  Loader2, AlertTriangle, Search, Activity, 
  User, Calendar, FileText, RefreshCw, Filter, Download, X
} from 'lucide-react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import * as XLSX from 'xlsx';

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

function UserLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/users/logs');
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.msg || "Gagal memuat log aktivitas user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const Badge = ({ variant, children }: any) => {
    const colors: any = {
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    };
    return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[variant] || colors.info}`}>{children}</span>;
  };

  const getActionBadge = (action: string) => {
    const lower = action?.toLowerCase() || '';
    if (lower.includes('login')) return <Badge variant="success">Login</Badge>;
    if (lower.includes('logout')) return <Badge variant="info">Logout</Badge>;
    if (lower.includes('create') || lower.includes('tambah') || lower.includes('add')) return <Badge variant="success">Create</Badge>;
    if (lower.includes('update') || lower.includes('edit') || lower.includes('ubah')) return <Badge variant="warning">Update</Badge>;
    if (lower.includes('delete') || lower.includes('hapus')) return <Badge variant="danger">Delete</Badge>;
    if (lower.includes('submit')) return <Badge variant="info">Submit</Badge>;
    if (lower.includes('approve')) return <Badge variant="success">Approve</Badge>;
    if (lower.includes('reject')) return <Badge variant="danger">Reject</Badge>;
    return <Badge variant="info">{action}</Badge>;
  };

  // Filter logs by date range
  const filteredLogs = useMemo(() => {
    let result = [...logs];
    
    if (dateRange.start) {
      result = result.filter(log => {
        const logDate = new Date(log.waktu).toISOString().split('T')[0];
        return logDate >= dateRange.start;
      });
    }
    
    if (dateRange.end) {
      result = result.filter(log => {
        const logDate = new Date(log.waktu).toISOString().split('T')[0];
        return logDate <= dateRange.end;
      });
    }
    
    return result;
  }, [logs, dateRange]);

  const handleExportExcel = () => {
    const selectedRows = Object.keys(rowSelection).map(idx => filteredLogs[parseInt(idx)]);
    const dataToExport = selectedRows.length > 0 ? selectedRows : filteredLogs;

    const exportData = dataToExport.map(log => ({
      'Waktu': new Date(log.waktu).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      'User ID': log.user_id,
      'Nama User': log.nama_lengkap || log.username || 'Unknown',
      'Aktivitas': log.aktivitas,
      'Detail Aktivitas': log.detail || log.aktivitas || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activity Logs');
    
    // Auto-size columns
    const maxWidth = exportData.reduce((w: any, r: any) => {
      return Object.keys(r).map((k, i) => {
        const cellValue = r[k]?.toString() || '';
        return Math.max(w[i] || 10, cellValue.length + 2);
      });
    }, []);
    ws['!cols'] = maxWidth.map((w: number) => ({ width: w }));

    const fileName = `activity-logs-${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
      accessorKey: 'waktu',
      header: 'Waktu',
      cell: ({ row }) => {
        const date = row.getValue('waktu');
        return new Date(date as string).toLocaleString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const date = new Date(row.getValue(columnId) as string).toLocaleDateString('id-ID');
        return filterValue.some((val: string) => date.includes(val));
      },
    },
    {
      accessorKey: 'nama_lengkap',
      header: 'User',
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-semibold text-black dark:text-white">
            {row.getValue('nama_lengkap') || row.original.username || 'Unknown'}
          </p>
          <p className="text-xs text-bodydark">ID: {row.original.user_id}</p>
        </div>
      ),
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const value = row.getValue(columnId) || row.original.username || 'Unknown';
        return filterValue.includes(String(value));
      },
    },
    {
      accessorKey: 'aktivitas',
      header: 'Aktivitas',
      cell: ({ row }) => getActionBadge(row.getValue('aktivitas')),
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        return filterValue.includes(String(row.getValue(columnId) || ''));
      },
    },
    {
      id: 'detail_aktivitas',
      accessorKey: 'aktivitas',
      header: 'Detail Aktivitas',
      cell: ({ row }) => (
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 mt-0.5 text-bodydark flex-shrink-0" />
          <span className="text-sm text-bodydark">{row.original.detail || row.getValue('aktivitas') || '-'}</span>
        </div>
      ),
      enableColumnFilter: false,
    },
  ], []);

  const table = useReactTable({
    data: filteredLogs,
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

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg dark:bg-red-900/20"><AlertTriangle className="inline h-5 w-5 mr-2" />{error}</div>;

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-black dark:text-white">Log Aktivitas User</h1>
        <p className="mt-2 text-sm text-bodydark1">Riwayat aktivitas pengguna sistem</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
        <h3 className="mb-4 text-sm font-semibold text-black dark:text-white">Filter Log</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Tanggal Mulai</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">Tanggal Akhir</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm dark:border-strokedark dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="w-full rounded-lg border border-stroke bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark dark:text-white"
            >
              Reset Filter
            </button>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-bodydark">Total Aktivitas</p>
              <h3 className="text-2xl font-bold text-black dark:text-white">{filteredLogs.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <User className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-bodydark">Unique Users</p>
              <h3 className="text-2xl font-bold text-black dark:text-white">
                {new Set(filteredLogs.map(l => l.user_id)).size}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-bodydark">Hari Ini</p>
              <h3 className="text-2xl font-bold text-black dark:text-white">
                {filteredLogs.filter(l => {
                  const logDate = new Date(l.waktu).toDateString();
                  const today = new Date().toDateString();
                  return logDate === today;
                }).length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
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
              onClick={handleExportExcel} 
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Download className="h-4 w-4" />
              Export Terpilih ({selectedCount})
            </button>
          )}
          <button 
            onClick={handleExportExcel} 
            className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark dark:text-white"
          >
            <Download className="h-4 w-4" />
            Export All
          </button>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium dark:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="Refresh (R)"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-stroke bg-white overflow-hidden shadow-sm dark:border-strokedark dark:bg-boxdark">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gradient-to-b from-gray-50 to-gray-100 text-xs font-semibold uppercase text-gray-700 dark:from-gray-800 dark:to-gray-900 dark:text-gray-300">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-stroke dark:border-strokedark">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-3 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-black dark:text-white">
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
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center">
                    <Activity className="mx-auto h-12 w-12 text-bodydark mb-2" />
                    <p className="text-bodydark">Tidak ada log aktivitas</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 text-sm text-gray-900 dark:text-gray-200">
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

export default withAuth(UserLogsPage);
