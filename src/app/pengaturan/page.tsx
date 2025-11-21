"use client";

import { useState, useEffect } from 'react';
import { withAuth } from '@/lib/auth';
import api from '@/lib/api';
import { 
  Settings, Save, RefreshCw, Database, Mail, 
  Shield, Bell, Globe, Palette, Loader2, Plus, Edit, Trash2, Building2, X
} from 'lucide-react';
import { useToast, ToastContainer } from '@/components/ui/alert';

function PengaturanPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast: showToast, removeToast } = useToast();

  // Divisi state
  const [divisiList, setDivisiList] = useState<any[]>([]);
  const [showDivisiModal, setShowDivisiModal] = useState(false);
  const [editingDivisi, setEditingDivisi] = useState<any>(null);
  const [divisiForm, setDivisiForm] = useState({
    nama_divisi: '',
    kode_divisi: '',
    use_existing_kode: false,
    use_existing_nama: false,
    selected_names: [] as string[], // For multi-select
    new_nama_input: '', // Input untuk nama divisi baru
  });
  const [deletingDivisi, setDeletingDivisi] = useState<string | null>(null);

  // Alert settings state
  const [alertSettings, setAlertSettings] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [updatingAlert, setUpdatingAlert] = useState<number | null>(null);

  const [settings, setSettings] = useState({
    // Aplikasi
    app_name: 'CiptaStok',
    app_version: '1.0.0',
    app_description: 'Sistem Manajemen Inventori',
    
    // Email
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_password: '',
    smtp_from: '',
    
    // Notifikasi
    enable_notifications: true,
    enable_email_alerts: false,
    low_stock_threshold: 10,
    
    // Sistem
    session_timeout: 30,
    max_login_attempts: 5,
    enable_audit_log: true,
    
    // Tampilan
    default_theme: 'light',
    items_per_page: 10,
    date_format: 'DD/MM/YYYY',
  });

  // Fetch divisi data
  const fetchDivisi = async () => {
    try {
      const res = await api.get('/master/divisi');
      setDivisiList(res.data);
    } catch (error) {
      console.error('Error fetching divisi:', error);
    }
  };

  // Group divisi by kode_divisi
  const groupedDivisi = divisiList.reduce((acc: any, divisi: any) => {
    const kode = divisi.kode_divisi;
    if (!acc[kode]) {
      acc[kode] = [];
    }
    acc[kode].push(divisi);
    return acc;
  }, {});

  // Fetch alert settings
  const fetchAlertSettings = async () => {
    try {
      setLoadingAlerts(true);
      const res = await api.get('/alerts/settings');
      setAlertSettings(res.data);
    } catch (error) {
      console.error('Error fetching alert settings:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchDivisi();
    fetchAlertSettings();
  }, []);

  // Divisi handlers
  const handleAddDivisi = () => {
    setEditingDivisi(null);
    setDivisiForm({ 
      nama_divisi: '', 
      kode_divisi: '',
      use_existing_kode: false,
      use_existing_nama: false,
      selected_names: [],
      new_nama_input: '',
    });
    setShowDivisiModal(true);
  };

  const handleEditDivisi = (divisiGroup: any) => {
    // For grouped display, we edit the kode and show all current names
    const names = divisiGroup.divisi_list.map((d: any) => d.nama_divisi);
    setEditingDivisi(divisiGroup);
    setDivisiForm({
      nama_divisi: names.join(', '),
      kode_divisi: divisiGroup.kode_divisi,
      use_existing_kode: false,
      use_existing_nama: false,
      selected_names: names,
      new_nama_input: '',
    });
    setShowDivisiModal(true);
  };

  const handleSaveDivisi = async () => {
    if (divisiForm.selected_names.length === 0 || !divisiForm.kode_divisi) {
      showToast({
        variant: 'error',
        message: 'Nama dan kode divisi wajib diisi!',
      });
      return;
    }

    try {
      setSaving(true);
      if (editingDivisi) {
        // Edit mode: Smart update to handle users
        const kode = divisiForm.kode_divisi;
        const oldEntries = editingDivisi.divisi_list;
        const newNames = divisiForm.selected_names;
        
        // Find which entries to keep, add, or remove
        const oldNames = oldEntries.map((d: any) => d.nama_divisi);
        const namesToAdd = newNames.filter((n: string) => !oldNames.includes(n));
        const namesToKeep = newNames.filter((n: string) => oldNames.includes(n));
        const namesToRemove = oldNames.filter((n: string) => !newNames.includes(n));
        
        // Get IDs to keep and remove
        const keepIds = oldEntries.filter((d: any) => namesToKeep.includes(d.nama_divisi)).map((d: any) => d.divisi_id);
        const removeEntries = oldEntries.filter((d: any) => namesToRemove.includes(d.nama_divisi));
        
        // If we have entries to remove, we need to handle users and products first
        if (removeEntries.length > 0 && keepIds.length > 0) {
          // Move users and products from removed entries to first kept entry
          const targetDivisiId = keepIds[0];
          const targetEntry = oldEntries.find((d: any) => d.divisi_id === targetDivisiId);
          
          for (const entry of removeEntries) {
            // Move users and products from this entry to target
            const migrateResult = await api.put(`/master/divisi/migrate-users/${entry.divisi_id}/${targetDivisiId}`);
            console.log(`Migrated from ${entry.nama_divisi} to ${targetEntry.nama_divisi}:`, migrateResult.data);
          }
        }
        
        // Now safe to delete removed entries
        for (const entry of removeEntries) {
          await api.delete(`/master/divisi/${entry.divisi_id}`);
        }
        
        // Add new names
        for (const nama of namesToAdd) {
          await api.post('/master/divisi', { kode_divisi: kode, nama_divisi: nama });
        }
        
        showToast({
          variant: 'success',
          message: `Divisi berhasil diupdate!${removeEntries.length > 0 ? ` (${removeEntries.length} nama divisi dihapus dengan aman)` : ''}`,
        });
      } else {
        // Add mode: Create entries for each selected name
        for (const nama of divisiForm.selected_names) {
          await api.post('/master/divisi', { kode_divisi: divisiForm.kode_divisi, nama_divisi: nama });
        }
        showToast({
          variant: 'success',
          message: 'Divisi berhasil ditambahkan!',
        });
      }
      setShowDivisiModal(false);
      fetchDivisi();
    } catch (error: any) {
      showToast({
        variant: 'error',
        message: error.response?.data?.msg || 'Gagal menyimpan divisi!',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDivisi = async (kode: string, divisiArray: any[]) => {
    const namaList = divisiArray.map(d => d.nama_divisi).join(', ');
    if (!confirm(`Hapus semua divisi dengan kode "${kode}"?\n\nNama: ${namaList}\n\nData akan dihapus permanent.`)) return;

    try {
      setDeletingDivisi(kode);
      // Delete all divisi entries with this kode
      for (const divisi of divisiArray) {
        await api.delete(`/master/divisi/${divisi.divisi_id}`);
      }
      showToast({
        variant: 'success',
        message: `Divisi ${kode} berhasil dihapus!`,
      });
      fetchDivisi();
    } catch (error: any) {
      showToast({
        variant: 'error',
        message: error.response?.data?.msg || 'Gagal menghapus divisi!',
      });
    } finally {
      setDeletingDivisi(null);
    }
  };

  // Alert handlers
  const handleToggleAlert = async (alertTypeId: number, currentEnabled: boolean) => {
    try {
      setUpdatingAlert(alertTypeId);
      await api.put(`/alerts/settings/${alertTypeId}`, {
        is_enabled: !currentEnabled,
      });
      showToast({
        variant: 'success',
        message: 'Pengaturan alert berhasil diupdate!',
      });
      fetchAlertSettings();
    } catch (error: any) {
      showToast({
        variant: 'error',
        message: error.response?.data?.msg || 'Gagal update alert!',
      });
    } finally {
      setUpdatingAlert(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast({
        variant: 'success',
        message: 'Pengaturan berhasil disimpan!',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        message: 'Gagal menyimpan pengaturan!',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      app_name: 'CiptaStok',
      app_version: '1.0.0',
      app_description: 'Sistem Manajemen Inventori',
      smtp_host: '',
      smtp_port: '',
      smtp_user: '',
      smtp_password: '',
      smtp_from: '',
      enable_notifications: true,
      enable_email_alerts: false,
      low_stock_threshold: 10,
      session_timeout: 30,
      max_login_attempts: 5,
      enable_audit_log: true,
      default_theme: 'light',
      items_per_page: 10,
      date_format: 'DD/MM/YYYY',
    });
    showToast({
      variant: 'info',
      message: 'Pengaturan direset ke nilai default',
    });
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">Pengaturan Sistem</h1>
            <p className="mt-2 text-sm text-bodydark1">Konfigurasi aplikasi dan preferensi sistem</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark dark:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        {/* Manajemen Divisi */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-white">Manajemen Divisi</h2>
                <p className="text-sm text-bodydark">Kelola divisi produk</p>
              </div>
            </div>
            <button
              onClick={handleAddDivisi}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Tambah Divisi
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b border-stroke bg-gray-2 dark:border-strokedark dark:bg-meta-4">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-black dark:text-white">
                    Kode Divisi
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-black dark:text-white">
                    Nama Divisi
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase text-black dark:text-white">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedDivisi).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-bodydark">
                      Tidak ada data divisi
                    </td>
                  </tr>
                ) : (
                  Object.entries(groupedDivisi).map(([kode, divisiArray]: [string, any]) => (
                    <tr key={kode} className="border-b border-stroke hover:bg-gray-2 dark:border-strokedark dark:hover:bg-meta-4">
                      <td className="px-4 py-4 text-sm font-semibold text-black dark:text-white">
                        {kode}
                      </td>
                      <td className="px-4 py-4 text-sm text-black dark:text-white">
                        {divisiArray.map((d: any) => d.nama_divisi).join(', ')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditDivisi({ kode_divisi: kode, divisi_list: divisiArray })}
                            className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
                            title="Edit Divisi"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDivisi(kode, divisiArray)}
                            disabled={deletingDivisi === kode}
                            className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600 disabled:opacity-50"
                            title="Hapus Divisi"
                          >
                            {deletingDivisi === kode ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manajemen Alert */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Manajemen Alert</h2>
              <p className="text-sm text-bodydark">Aktifkan/nonaktifkan alert yang muncul di sistem</p>
            </div>
          </div>

          {loadingAlerts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {alertSettings.map((alert) => (
                <div
                  key={alert.alert_type_id}
                  className="flex items-start justify-between rounded-lg border border-stroke p-4 dark:border-strokedark"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-black dark:text-white">
                        {alert.type_name}
                      </h3>
                      {alert.is_system && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          System
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-bodydark">
                      {alert.description}
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={alert.is_enabled}
                      onChange={() => handleToggleAlert(alert.alert_type_id, alert.is_enabled)}
                      disabled={updatingAlert === alert.alert_type_id}
                      className="peer sr-only"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:border-gray-600 dark:bg-gray-700"></div>
                  </label>
                </div>
              ))}
              {alertSettings.length === 0 && (
                <div className="py-8 text-center text-bodydark">
                  Tidak ada alert tersedia
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divisi Modal */}
        {showDivisiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-black dark:text-white">
                  {editingDivisi ? 'Edit Divisi' : 'Tambah Divisi'}
                </h2>
                <button
                  onClick={() => setShowDivisiModal(false)}
                  disabled={saving}
                  className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* KODE DIVISI */}
                {editingDivisi ? (
                  // Edit Mode: Kode tidak bisa diubah
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Kode Divisi
                    </label>
                    <input
                      type="text"
                      value={divisiForm.kode_divisi}
                      disabled
                      className="w-full rounded-lg border border-stroke bg-gray-100 px-4 py-3 text-gray-600 outline-none dark:border-strokedark dark:bg-meta-4 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-bodydark">Kode divisi tidak dapat diubah</p>
                  </div>
                ) : (
                  // Add Mode: Input atau dropdown
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Kode Divisi <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Input Kode Baru */}
                    <input
                      type="text"
                      value={divisiForm.use_existing_kode ? '' : divisiForm.kode_divisi}
                      onChange={(e) => setDivisiForm({ ...divisiForm, kode_divisi: e.target.value, use_existing_kode: false })}
                      disabled={divisiForm.use_existing_kode}
                      placeholder="Contoh: MU245"
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-strokedark dark:text-white dark:disabled:bg-meta-4"
                    />
                    
                    <div className="my-2 flex items-center gap-2">
                      <div className="h-px flex-1 bg-stroke dark:bg-strokedark"></div>
                      <span className="text-xs text-bodydark">ATAU</span>
                      <div className="h-px flex-1 bg-stroke dark:bg-strokedark"></div>
                    </div>

                    {/* Dropdown Kode Existing */}
                    <select
                      value={divisiForm.use_existing_kode ? divisiForm.kode_divisi : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDivisiForm({ 
                            ...divisiForm, 
                            kode_divisi: e.target.value,
                            use_existing_kode: true 
                          });
                        }
                      }}
                      disabled={!divisiForm.use_existing_kode && divisiForm.kode_divisi !== ''}
                      className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-strokedark dark:text-white dark:disabled:bg-meta-4"
                    >
                      <option value="">Pilih dari kode existing</option>
                      {[...new Set(divisiList.map(d => d.kode_divisi))].map((kode, idx) => (
                        <option key={idx} value={kode}>
                          {kode}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-bodydark">Input kode baru atau pilih dari existing</p>
                  </div>
                )}

                {/* NAMA DIVISI */}
                {editingDivisi ? (
                  // Edit Mode: Multi-select checkbox dropdown
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Nama Divisi <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div 
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white cursor-pointer min-h-[48px]"
                        onClick={(e) => {
                          const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                          if (dropdown) dropdown.classList.toggle('hidden');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {divisiForm.selected_names.length > 0 ? (
                              divisiForm.selected_names.map((nama, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  {nama}
                                </span>
                              ))
                            ) : (
                              <span className="text-bodydark">Pilih nama divisi...</span>
                            )}
                          </div>
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div className="hidden absolute z-10 mt-1 w-full rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark max-h-60 overflow-y-auto">
                        {[...new Set(divisiList.map(d => d.nama_divisi))].map((nama, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer"
                            onClick={() => {
                              const newSelected = divisiForm.selected_names.includes(nama)
                                ? divisiForm.selected_names.filter(n => n !== nama)
                                : [...divisiForm.selected_names, nama];
                              setDivisiForm({ ...divisiForm, selected_names: newSelected });
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={divisiForm.selected_names.includes(nama)}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label className="flex-1 cursor-pointer text-sm">{nama}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-bodydark">
                      Pilih satu atau lebih nama. Kode: <span className="font-semibold text-primary">{divisiForm.kode_divisi}</span>
                    </p>
                  </div>
                ) : (
                  // Add Mode: Multi-select checkbox dropdown
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                      Nama Divisi <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Input Nama Baru */}
                    <div className="mb-3">
                      <input
                        type="text"
                        value={divisiForm.new_nama_input}
                        onChange={(e) => setDivisiForm({ ...divisiForm, new_nama_input: e.target.value })}
                        placeholder="Ketik nama divisi baru (tekan Enter)"
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && divisiForm.new_nama_input.trim()) {
                            e.preventDefault();
                            const newNama = divisiForm.new_nama_input.trim();
                            if (!divisiForm.selected_names.includes(newNama)) {
                              setDivisiForm({ 
                                ...divisiForm, 
                                selected_names: [...divisiForm.selected_names, newNama],
                                new_nama_input: ''
                              });
                            } else {
                              alert('Nama divisi sudah ada dalam daftar!');
                            }
                          }
                        }}
                      />
                      {divisiForm.new_nama_input && (
                        <button
                          type="button"
                          onClick={() => {
                            const newNama = divisiForm.new_nama_input.trim();
                            if (newNama) {
                              if (!divisiForm.selected_names.includes(newNama)) {
                                setDivisiForm({ 
                                  ...divisiForm, 
                                  selected_names: [...divisiForm.selected_names, newNama],
                                  new_nama_input: ''
                                });
                              } else {
                                alert('Nama divisi sudah ada dalam daftar!');
                              }
                            }
                          }}
                          className="mt-2 w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                        >
                          + Tambahkan &quot;{divisiForm.new_nama_input.trim()}&quot;
                        </button>
                      )}
                    </div>

                    <div className="my-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-stroke dark:bg-strokedark"></div>
                      <span className="text-xs text-bodydark">ATAU</span>
                      <div className="h-px flex-1 bg-stroke dark:bg-strokedark"></div>
                    </div>
                    
                    <div className="relative">
                      <div 
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-black outline-none focus:border-primary dark:border-strokedark dark:text-white cursor-pointer min-h-[48px]"
                        onClick={(e) => {
                          const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                          if (dropdown) dropdown.classList.toggle('hidden');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {divisiForm.selected_names.length > 0 ? (
                              divisiForm.selected_names.map((nama, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                  {nama}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDivisiForm({ 
                                        ...divisiForm, 
                                        selected_names: divisiForm.selected_names.filter(n => n !== nama)
                                      });
                                    }}
                                    className="hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            ) : (
                              <span className="text-bodydark">Pilih nama divisi...</span>
                            )}
                          </div>
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <div className="hidden absolute z-10 mt-1 w-full rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark max-h-60 overflow-y-auto">
                        {[...new Set(divisiList.map(d => d.nama_divisi))].map((nama, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer"
                            onClick={() => {
                              const newSelected = divisiForm.selected_names.includes(nama)
                                ? divisiForm.selected_names.filter(n => n !== nama)
                                : [...divisiForm.selected_names, nama];
                              setDivisiForm({ ...divisiForm, selected_names: newSelected });
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={divisiForm.selected_names.includes(nama)}
                              onChange={() => {}}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label className="flex-1 cursor-pointer text-sm">{nama}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-bodydark">Ketik nama baru di atas atau pilih dari list existing</p>
                  </div>
                )}

                {/* Preview */}
                {(divisiForm.kode_divisi || divisiForm.selected_names.length > 0) && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">✓ Preview Divisi:</p>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      {divisiForm.kode_divisi || '(Kode belum diisi)'} - {divisiForm.selected_names.join(', ') || '(Nama belum dipilih)'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowDivisiModal(false)}
                  disabled={saving}
                  className="border border-stroke bg-white hover:bg-gray-2 dark:border-strokedark dark:bg-boxdark rounded-lg px-5 py-2.5 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveDivisi}
                  disabled={saving || divisiForm.selected_names.length === 0 || !divisiForm.kode_divisi}
                  className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    editingDivisi ? 'Update Divisi' : 'Tambah Divisi'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Konfigurasi Email */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Konfigurasi Email (SMTP)</h2>
              <p className="text-sm text-bodydark">Pengaturan untuk pengiriman email notifikasi</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                SMTP Host
              </label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                SMTP Port
              </label>
              <input
                type="number"
                placeholder="587"
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Username/Email
              </label>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={settings.smtp_password}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                From Email
              </label>
              <input
                type="email"
                placeholder="noreply@example.com"
                value={settings.smtp_from}
                onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Notifikasi */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Notifikasi</h2>
              <p className="text-sm text-bodydark">Pengaturan notifikasi dan peringatan</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">Aktifkan Notifikasi</p>
                <p className="text-xs text-bodydark">Tampilkan notifikasi dalam aplikasi</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.enable_notifications}
                  onChange={(e) => setSettings({ ...settings, enable_notifications: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:border-gray-600 dark:bg-gray-700"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black dark:text-white">Email Alert</p>
                <p className="text-xs text-bodydark">Kirim peringatan melalui email</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.enable_email_alerts}
                  onChange={(e) => setSettings({ ...settings, enable_email_alerts: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:border-gray-600 dark:bg-gray-700"></div>
              </label>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Threshold Stok Rendah
              </label>
              <input
                type="number"
                value={settings.low_stock_threshold}
                onChange={(e) => setSettings({ ...settings, low_stock_threshold: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
              <p className="mt-1 text-xs text-bodydark">Notifikasi akan muncul jika stok di bawah nilai ini</p>
            </div>
          </div>
        </div>

        {/* Keamanan */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Keamanan</h2>
              <p className="text-sm text-bodydark">Pengaturan keamanan dan autentikasi</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Session Timeout (menit)
              </label>
              <input
                type="number"
                value={settings.session_timeout}
                onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={settings.max_login_attempts}
                onChange={(e) => setSettings({ ...settings, max_login_attempts: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black dark:text-white">Audit Log</p>
                  <p className="text-xs text-bodydark">Catat semua aktivitas pengguna</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={settings.enable_audit_log}
                    onChange={(e) => setSettings({ ...settings, enable_audit_log: e.target.checked })}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:border-gray-600 dark:bg-gray-700"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Tampilan */}
        <div className="rounded-xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Palette className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black dark:text-white">Tampilan</h2>
              <p className="text-sm text-bodydark">Preferensi tampilan aplikasi</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Theme Default
              </label>
              <select
                value={settings.default_theme}
                onChange={(e) => setSettings({ ...settings, default_theme: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Items Per Page
              </label>
              <select
                value={settings.items_per_page}
                onChange={(e) => setSettings({ ...settings, items_per_page: parseInt(e.target.value) })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                Format Tanggal
              </label>
              <select
                value={settings.date_format}
                onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAuth(PengaturanPage);
