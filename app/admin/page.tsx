"use client";
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  // ==========================================
  // STATE AUTENTIKASI (LOGIN)
  // ==========================================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ==========================================
  // STATE DATA UTAMA DASHBOARD (PERBAIKAN: Tambah 'bookings')
  // ==========================================
  const [activeTab, setActiveTab] = useState<'dokter' | 'edukasi' | 'skincare' | 'treatments' | 'bookings'>('dokter');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]); // State baru untuk daftar reservasi pasien
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // STATE PENCARIAN (UNTUK SEMUA TAB)
  // ==========================================
  const [searchDoctor, setSearchDoctor] = useState("");
  const [searchEdu, setSearchEdu] = useState("");
  const [searchSkincare, setSearchSkincare] = useState("");
  const [searchTreatment, setSearchTreatment] = useState("");
  const [searchBooking, setSearchBooking] = useState(""); // State pencarian booking baru

  // ==========================================
  // STATE MODAL & FORM
  // ==========================================
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState({
    id: null as number | null,
    name: '',
    specialty: '',
    schedule: '',
    exp: '',
    status: 'Available'
  });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    id: null as number | null, brand: '', product_name: '', product_type: 'SERUM', claim_category: 'acne', price: 0, ingredients_list: '', is_available: true
  });

  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState({
    id: null as number | null, treatment_name: '', type: 'acne', benefit: '', method: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eduForm, setEduForm] = useState({ 
    type: 'article', category: 'Skincare 101', title: '', content: '', image: '', duration: '' 
  });
  
  // ==========================================
  // EFEK CEK LOGIN SAAT HALAMAN DIBUKA
  // ==========================================
  useEffect(() => {
    const token = localStorage.getItem("adminAuthToken");
    if (token) {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  // EFEK FETCH DATA JIKA SUDAH LOGIN
  useEffect(() => { 
    if (isAuthenticated) {
      fetchData(); 
    }
  }, [isAuthenticated]);

  // ==========================================
  // FUNGSI LOGIN & LOGOUT
  // ==========================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch('http://localhost:8000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        localStorage.setItem("adminAuthToken", data.token || "logged_in_true");
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || "Username atau password salah.");
      }
    } catch (error) {
      setLoginError("Koneksi ke server gagal. Pastikan backend menyala.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if(confirm("Yakin ingin keluar?")) {
      localStorage.removeItem("adminAuthToken");
      setIsAuthenticated(false);
      setUsername("");
      setPassword("");
    }
  };

  // ==========================================
  // FUNGSI FETCH DATA KESELURUHAN (PERBAIKAN: Tambah Fetch Bookings)
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const resDoc = await fetch('http://localhost:8000/api/doctors');
      if (resDoc.ok) { 
        const data = await resDoc.json(); 
        if (data.status === "success") setDoctors(data.data); 
      }

      const resEdu = await fetch('http://localhost:8000/api/educations');
      if (resEdu.ok) { 
        const data = await resEdu.json(); 
        if (data.status === "success") setEducations(data.data); 
      }

      const resProd = await fetch('http://localhost:8000/api/products');
      if (resProd.ok) setProducts(await resProd.json());

      const resTreat = await fetch('http://localhost:8000/api/treatments/all');
      if (resTreat.ok) {
        const rawData = await resTreat.json();
        const dataWithIds = rawData.map((t: any, index: number) => ({
          ...t,
          id: t.id || (Date.now() + index) 
        }));
        setTreatments(dataWithIds);
      }

      // Integrasi Baru: Mengambil data pasien yang sudah melakukan booking dari FastAPI
      // ========================================================
      // AMBIL DATA RESERVASI PASIEN
      // ========================================================
      // AMBIL DATA RESERVASI PASIEN
      const resBook = await fetch('http://localhost:8000/api/bookings');
      if (resBook.ok) {
        const bookingResult = await resBook.json();
        if (bookingResult.status === "success" && Array.isArray(bookingResult.data)) {
          setBookings(bookingResult.data);
        } else if (Array.isArray(bookingResult)) {
          setBookings(bookingResult);
        }
      } else {
        // PERBAIKAN SEMENTARA: Tangkap pesan error asli dari backend
        const errorDetail = await resBook.text();
        console.error(`Gagal memuat data booking! Status: ${resBook.status}. Detail Backend:`, errorDetail);
      }
      } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDoctorImage = async (doctorId: number, file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://localhost:8000/api/doctors/${doctorId}/image`, {
        method: 'POST',
        body: formData, 
      });

      const result = await response.json();
      if (result.status === "success") {
        alert("Foto dokter berhasil diperbarui!");
        fetchData(); 
      } else {
        alert("Gagal: " + result.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat mengunggah foto.");
    }
  };

  // ==========================================
  // FUNGSI CRUD DOKTER
  // ==========================================
  const handleOpenDoctorModal = (doctor: any = null) => {
    if (doctor) {
      setDoctorForm({ ...doctor });
    } else {
      setDoctorForm({ id: null, name: '', specialty: '', schedule: '', exp: '', status: 'Available' });
    }
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doctorForm)
      });

      if (response.ok) {
        alert("Dokter berhasil ditambahkan!");
        setIsDoctorModalOpen(false);
        fetchData(); 
      } else {
        alert("Gagal menyimpan data dokter.");
      }
    } catch (error) {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (doctorId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Available' ? 'Fully Booked' : 'Available';
    try {
      const response = await fetch(`http://localhost:8000/api/doctors/${doctorId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        alert("Status dokter berhasil diupdate!");
        fetchData();
      } else {
        // PERBAIKAN: Tambahkan ini agar sistem tidak diam saja jika gagal
        alert(`Gagal mengupdate status! Server mengembalikan error.`);
      }
    } catch (error) {
      alert("Koneksi gagal. Pastikan backend menyala.");
    }
  };

  // ==========================================
  // FUNGSI CRUD EDUKASI
  // ==========================================
  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:8000/api/educations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eduForm)
      });
      
      if (response.ok) {
        alert("Konten berhasil ditambahkan!");
        setEduForm({ type: 'article', category: 'Skincare 101', title: '', content: '', image: '', duration: '' }); 
        fetchData(); 
      } else {
        alert("Gagal menambahkan konten. Periksa koneksi backend.");
      }
    } catch (error) {
      alert("Terjadi kesalahan pada server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEducation = async (id: number) => {
    if (!confirm("Yakin ingin menghapus konten ini?")) return;
    try {
      const response = await fetch(`http://localhost:8000/api/educations/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEducations(prev => prev.filter(item => item.id !== id));
        alert("Konten berhasil dihapus!");
      } else {
        alert("Gagal menghapus konten di server.");
      }
    } catch (error) {
      alert("Gagal terhubung ke server.");
    }
  };

  // ==========================================
  // FUNGSI CRUD SKINCARE (PRODUK)
  // ==========================================
  const handleOpenProductModal = (product: any = null) => {
    if (product) {
      setProductForm({ ...product }); 
    } else {
      setProductForm({ id: null, brand: '', product_name: '', product_type: 'SERUM', claim_category: 'acne', price: 0, ingredients_list: '', is_available: true }); 
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (productForm.id) {
        setProducts(products.map(p => p.id === productForm.id ? productForm : p));
        alert("Produk berhasil diperbarui!");
      } else {
        const newProduct = { ...productForm, id: Date.now() }; 
        setProducts([newProduct, ...products]);
        alert("Produk berhasil ditambahkan!");
      }
      setIsProductModalOpen(false);
    } catch (error) {
      alert("Gagal menyimpan produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Yakin ingin menghapus produk ini permanen?")) return;
    try {
      setProducts(products.filter(p => p.id !== id));
      alert("Produk dihapus.");
    } catch (error) { alert("Gagal menghapus produk."); }
  };

  const toggleProductAvailability = async (id: number, currentStatus: any) => {
    const isCurrentlyAvailable = currentStatus === true || currentStatus === 1 || currentStatus === "1";
    const newStatus = !isCurrentlyAvailable; 
    
    setProducts(products.map(p => p.id === id ? { ...p, is_available: newStatus } : p));
    
    try {
      const response = await fetch(`http://localhost:8000/api/products/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: newStatus })
      });

      if (!response.ok) {
        alert("Gagal mengubah status di database!");
        setProducts(products.map(p => p.id === id ? { ...p, is_available: isCurrentlyAvailable } : p));
      } else {
        alert("Status produk berhasil diupdate!");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Koneksi server terputus.");
      setProducts(products.map(p => p.id === id ? { ...p, is_available: isCurrentlyAvailable } : p));
    }
  };

  // ==========================================
  // FUNGSI CRUD TREATMENT
  // ==========================================
  const handleOpenTreatmentModal = (treatment: any = null) => {
    if (treatment) {
      setTreatmentForm({ ...treatment });
    } else {
      setTreatmentForm({ id: null, treatment_name: '', type: 'acne', benefit: '', method: '' });
    }
    setIsTreatmentModalOpen(true);
  };

  const handleSaveTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (treatmentForm.id) {
        setTreatments(treatments.map(t => t.id === treatmentForm.id ? treatmentForm : t));
        alert("Treatment berhasil diperbarui!");
      } else {
        setTreatments([{ ...treatmentForm, id: Date.now() }, ...treatments]);
        alert("Treatment berhasil ditambahkan!");
      }
      setIsTreatmentModalOpen(false);
    } catch (error) { alert("Gagal menyimpan treatment."); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTreatment = async (id: number) => {
    if (!confirm("Yakin ingin menghapus treatment ini?")) return;
    setTreatments(treatments.filter(t => t.id !== id));
    alert("Treatment dihapus.");
  };

  // ==========================================
  // LOGIKA FILTER PENCARIAN
  // ==========================================
  const filteredDoctors = doctors.filter(d => 
    d.name?.toLowerCase().includes(searchDoctor.toLowerCase()) || 
    d.specialty?.toLowerCase().includes(searchDoctor.toLowerCase())
  );

  const filteredEducations = educations.filter(e => 
    e.title?.toLowerCase().includes(searchEdu.toLowerCase()) || 
    e.category?.toLowerCase().includes(searchEdu.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.product_name?.toLowerCase().includes(searchSkincare.toLowerCase()) || 
    p.brand?.toLowerCase().includes(searchSkincare.toLowerCase())
  );

  const filteredTreatments = treatments.filter(t => 
    t.treatment_name?.toLowerCase().includes(searchTreatment.toLowerCase()) || 
    (t.type || t.category || '').toLowerCase().includes(searchTreatment.toLowerCase())
  );

  // Filter pencarian untuk data booking pasien
  const filteredBookings = bookings.filter(b => 
    b.patient_name?.toLowerCase().includes(searchBooking.toLowerCase()) ||
    b.booking_id?.toLowerCase().includes(searchBooking.toLowerCase()) ||
    doctors.find(d => d.id === b.doctor_id)?.name?.toLowerCase().includes(searchBooking.toLowerCase())
  );

  // ==========================================
  // TAMPILAN LOADING AWAL
  // ==========================================
  if (isCheckingAuth) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // ==========================================
  // TAMPILAN HALAMAN LOGIN (JIKA BELUM LOGIN)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#660033] font-serif mb-2">SkinSight Admin</h1>
            <p className="text-sm text-gray-500">Silakan login untuk mengakses dashboard manajemen.</p>
          </div>
          
          {loginError && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium text-center border border-red-100">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
              <input 
                type="text" 
                required 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#660033] focus:ring-1 focus:ring-[#660033] transition-all"
                placeholder="Masukkan username"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#660033] focus:ring-1 focus:ring-[#660033] transition-all"
                placeholder="Masukkan password"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-[#660033] text-white py-3 rounded-lg font-bold hover:bg-[#4A0024] transition-all mt-4 disabled:opacity-70 flex justify-center items-center"
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Masuk ke Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN DASHBOARD (JIKA SUDAH LOGIN)
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6 font-sans relative">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER & TABS */}
        <header className="mb-8">
          <div className="flex justify-between items-end mb-6">
            <h1 className="text-3xl font-bold text-gray-800 font-serif">Admin Dashboard</h1>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              Keluar Sistem
            </button>
          </div>

          <div className="flex gap-4 border-b border-gray-200 pb-px overflow-x-auto custom-scrollbar">
            {/* PERBAIKAN: Menambahkan opsi tab 'bookings' */}
            {['dokter', 'edukasi', 'skincare', 'treatments', 'bookings'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 px-2 font-bold transition-all whitespace-nowrap capitalize ${activeTab === tab ? 'border-b-2 border-[#660033] text-[#660033]' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {tab === 'bookings' ? 'Daftar Reservasi Pasien' : `Manajemen ${tab}`}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <>
            {/* ========================================= */}
            {/* TAB 1: MANAJEMEN DOKTER                     */}
            {/* ========================================= */}
            {activeTab === 'dokter' && (
              <div>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                  <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400">🔍</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Cari nama atau spesialisasi..." 
                      className="w-full border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#660033] focus:ring-1 focus:ring-[#660033] transition-all bg-white shadow-sm" 
                      value={searchDoctor} 
                      onChange={(e) => setSearchDoctor(e.target.value)} 
                    />
                  </div>

                  <button 
                    onClick={() => handleOpenDoctorModal()} 
                    className="w-full md:w-auto bg-[#660033] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4A0024] transition-all text-sm whitespace-nowrap shadow-lg shadow-[#660033]/20 flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">+</span> Tambah Dokter
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                        <th className="p-4 font-semibold">Nama Dokter</th>
                        <th className="p-4 font-semibold">Spesialisasi</th>
                        <th className="p-4 font-semibold">Status Saat Ini</th>
                        <th className="p-4 font-semibold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDoctors.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors border-b border-gray-100">                    
                        <td className="p-4 align-top">
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0 mt-1">
                              <img src={doc.image || "https://via.placeholder.com/150"} alt={doc.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#EAE3D9] shadow-sm" />
                            </div>
                            <div className="flex flex-col">
                              <p className="font-bold text-[#3A2E2B] text-sm mb-1">{doc.name}</p>
                              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) { handleUploadDoctorImage(doc.id, e.target.files[0]); } }} className="text-[10px] file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-[#660033]/10 file:text-[#660033] hover:file:bg-[#660033]/20 cursor-pointer w-full max-w-[180px] text-gray-500" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <p className="text-sm text-gray-600 mt-1">{doc.specialty}</p>
                        </td>
                        <td className="p-4 align-top">
                          <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${doc.status === 'Available' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="p-4 align-top text-right">
                          <button onClick={() => toggleStatus(doc.id, doc.status)} className={`mt-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${doc.status === 'Available' ? "bg-red-500 hover:bg-red-600 text-white shadow-md" : "bg-[#25D366] hover:bg-[#1EBE59] text-white shadow-md"}`}>
                            {doc.status === 'Available' ? "Tutup Jadwal" : "Buka Jadwal"}
                          </button>
                        </td>
                      </tr>
                      ))}
                      {filteredDoctors.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">Dokter tidak ditemukan.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 2: MANAJEMEN EDUKASI                    */}
            {/* ========================================= */}
            {activeTab === 'edukasi' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Tambah Konten Baru</h2>
                    <form onSubmit={handleAddEducation} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Tipe Konten</label>
                        <select value={eduForm.type} onChange={e => setEduForm({...eduForm, type: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#660033]">
                          <option value="article">Article</option>
                          <option value="video">Video</option>
                          <option value="quote">Quote / Myth vs Fact</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Kategori</label>
                        <select value={eduForm.category} onChange={e => setEduForm({...eduForm, category: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#660033]">
                          <option value="Skincare 101">Skincare 101</option>
                          <option value="Tutorials">Tutorials</option>
                          <option value="Myths vs Facts">Myths vs Facts</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">Judul / Title (Opsional)</label>
                        <input type="text" value={eduForm.title} onChange={e => setEduForm({...eduForm, title: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#660033]" placeholder="Kosongkan jika pakai YouTube/TikTok" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1">
                          {eduForm.type === 'quote' ? 'Isi Konten (Teks)' : 'Link Konten (URL)'}
                        </label>
                        {eduForm.type === 'video' || eduForm.type === 'article' ? (
                          <input type="url" required value={eduForm.content} onChange={e => setEduForm({...eduForm, content: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#660033]" placeholder={eduForm.type === 'video' ? "https://www.youtube.com/..." : "https://link-artikel.com/..."} />
                        ) : (
                          <textarea required rows={3} value={eduForm.content} onChange={e => setEduForm({...eduForm, content: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#660033]" placeholder="Tuliskan mitos atau fakta di sini..."></textarea>
                        )}
                      </div>
                      {eduForm.type !== 'quote' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Link Gambar (Opsional)</label>
                          <input type="text" value={eduForm.image} onChange={e => setEduForm({...eduForm, image: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#660033]" placeholder="Kosongkan untuk otomatis" />
                        </div>
                      )}
                      {eduForm.type === 'video' && (
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Durasi Video</label>
                          <input type="text" required value={eduForm.duration} onChange={e => setEduForm({...eduForm, duration: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:border-[#660033]" placeholder="Contoh: 1:30" />
                        </div>
                      )}
                      <button type="submit" disabled={isSubmitting} className="w-full bg-[#660033] text-white py-3 rounded-lg font-bold hover:bg-[#4A0024] transition-all mt-4">
                        {isSubmitting ? 'Menyimpan...' : '+ Simpan Konten'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <input type="text" placeholder="Cari judul atau kategori edukasi..." className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#660033]" value={searchEdu} onChange={(e) => setSearchEdu(e.target.value)} />
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                          <th className="p-4 font-semibold">Tipe</th>
                          <th className="p-4 font-semibold">Kategori</th>
                          <th className="p-4 font-semibold">Judul</th>
                          <th className="p-4 font-semibold text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredEducations.map((edu) => (
                          <tr key={edu.id} className="hover:bg-gray-50">
                            <td className="p-4"><span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded font-bold uppercase">{edu.type}</span></td>
                            <td className="p-4 text-sm text-gray-500">{edu.category}</td>
                            <td className="p-4 font-bold text-gray-800 text-sm">{edu.title}</td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleDeleteEducation(edu.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Hapus</button>
                            </td>
                          </tr>
                        ))}
                        {filteredEducations.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-gray-500">Konten edukasi tidak ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 3: MANAJEMEN SKINCARE                   */}
            {/* ========================================= */}
            {activeTab === 'skincare' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                  <input type="text" placeholder="Cari nama produk atau brand..." className="w-full md:w-1/3 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#660033]" value={searchSkincare} onChange={(e) => setSearchSkincare(e.target.value)} />
                  <button onClick={() => handleOpenProductModal()} className="bg-[#660033] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4A0024] transition-all text-sm whitespace-nowrap">
                    + Tambah Produk
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-gray-100 z-10">
                        <tr className="text-gray-600 text-sm uppercase tracking-wider">
                          <th className="p-4 font-semibold">Produk</th>
                          <th className="p-4 font-semibold">Kategori Klaim</th>
                          <th className="p-4 font-semibold">Harga</th>
                          <th className="p-4 font-semibold text-center">Stok</th>
                          <th className="p-4 font-semibold text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                        {filteredProducts.map((p, idx) => (
                          <tr key={p.id || idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <p className="font-bold">{p.product_name}</p>
                              <p className="text-xs text-gray-500">{p.brand} • {p.product_type}</p>
                            </td>
                            <td className="p-4">
                              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                {p.claim_category || p.ingredients_category || '-'}
                              </span>
                            </td>
                            <td className="p-4 font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(p.price)}</td>
                            <td className="p-4 text-center">
                              <button onClick={() => toggleProductAvailability(p.id, p.is_available ?? true)} className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${(p.is_available ?? true) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {(p.is_available ?? true) ? "Tersedia" : "Habis"}
                              </button>
                            </td>
                            <td className="p-4 text-center whitespace-nowrap">
                              <button onClick={() => handleOpenProductModal(p)} className="text-blue-500 hover:text-blue-700 font-bold text-xs mx-2">Edit</button>
                              <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 font-bold text-xs mx-2">Hapus</button>
                            </td>
                          </tr>
                        ))}
                        {filteredProducts.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-gray-500">Skincare tidak ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* TAB 4: MANAJEMEN TREATMENT                  */}
            {/* ========================================= */}
            {activeTab === 'treatments' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                  <input type="text" placeholder="Cari nama atau target treatment..." className="w-full md:w-1/3 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#660033]" value={searchTreatment} onChange={(e) => setSearchTreatment(e.target.value)} />
                  <button onClick={() => handleOpenTreatmentModal()} className="bg-[#660033] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4A0024] transition-all text-sm whitespace-nowrap">
                    + Tambah Treatment
                  </button>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                      <tr>
                        <th className="p-4 font-semibold">Nama Treatment</th>
                        <th className="p-4 font-semibold">Kategori</th>
                        <th className="p-4 font-semibold">Target Keluhan</th>
                        <th className="p-4 font-semibold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                      {filteredTreatments.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-gray-50">
                          <td className="p-4 font-bold">{t.treatment_name || t.name}</td>
                          <td className="p-4"><span className="bg-gray-200 px-2 py-1 rounded text-xs font-bold uppercase">{t.type || t.category}</span></td>
                          <td className="p-4 text-gray-500 line-clamp-1">{t.benefit || t.tujuan}</td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button onClick={() => handleOpenTreatmentModal(t)} className="text-blue-500 hover:text-blue-700 font-bold text-xs mx-2">Edit</button>
                            <button onClick={() => handleDeleteTreatment(t.id)} className="text-red-500 hover:text-red-700 font-bold text-xs mx-2">Hapus</button>
                          </td>
                        </tr>
                      ))}
                      {filteredTreatments.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-500">Treatment tidak ditemukan.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* INTEGRASI TAB BARU: TAB 5: DAFTAR RESERVASI PASIEN (BOOKINGS) */}
            {/* ========================================================= */}
            {activeTab === 'bookings' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
                  <input 
                    type="text" 
                    placeholder="Cari nama pasien atau ID reservasi (SKS-xxxx)..." 
                    className="w-full md:w-1/3 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#660033]" 
                    value={searchBooking} 
                    onChange={(e) => setSearchBooking(e.target.value)} 
                  />
                  <div className="text-xs font-bold text-gray-500 flex items-center bg-gray-100 px-4 py-2 rounded-lg border">
                    Total Reservasi: {bookings.length} Pasien
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                          <th className="p-4 font-semibold">ID Booking</th>
                          <th className="p-4 font-semibold">Nama Pasien</th>
                          <th className="p-4 font-semibold">Dokter Tujuan</th>
                          <th className="p-4 font-semibold">Tanggal Kunjungan</th>
                          <th className="p-4 font-semibold">Sesi & Keluhan Medis</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
                        {filteredBookings.map((b, idx) => {
                          // Mencari relasi nama dokter berdasarkan doctor_id di database booking
                            const targetDoctor = doctors.find(d => String(d.id) === String(b.doctor_id));                          return (
                            <tr key={b.booking_id || idx} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-mono font-bold text-[#660033]">
                                {b.booking_id || `SKS-REC-${idx}`}
                              </td>
                              <td className="p-4 font-medium text-gray-900">
                                {b.patient_name}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {targetDoctor?.image && (
                                    <img src={targetDoctor.image} className="w-6 h-6 rounded-full object-cover border" alt="" />
                                  )}
                                  <p className="font-bold text-gray-700">{targetDoctor?.name || `Dokter (ID: ${b.doctor_id})`}</p>
                                </div>
                              </td>
                              <td className="p-4 font-medium">
                                {b.booking_date}
                              </td>
                              <td className="p-4 text-xs text-gray-600 max-w-xs leading-relaxed">
                                {b.session_time}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredBookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                              Tidak ada data reservasi pasien ditemukan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ========================================= */}
      {/* MODAL SKINCARE (TAMBAH / EDIT)              */}
      {/* ========================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-[#3A2E2B]">{productForm.id ? "Edit Skincare" : "Tambah Skincare Baru"}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Brand</label>
                  <input required type="text" value={productForm.brand} onChange={e => setProductForm({...productForm, brand: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Harga (Rp)</label>
                  <input required type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: Number(e.target.value)})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Produk</label>
                <input required type="text" value={productForm.product_name} onChange={e => setProductForm({...productForm, product_name: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Tipe Produk</label>
                  <select value={productForm.product_type} onChange={e => setProductForm({...productForm, product_type: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none">
                    <option value="FACE WASH">Face Wash</option>
                    <option value="TONER">Toner</option>
                    <option value="SERUM">Serum</option>
                    <option value="MOISTURIZER">Moisturizer</option>
                    <option value="SUNSCREEN">Sunscreen</option>
                    <option value="MASK">Masker / Clay Stick</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Kategori (Label AI)</label>
                  <select value={productForm.claim_category} onChange={e => setProductForm({...productForm, claim_category: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none">
                    <option value="acne">Acne</option>
                    <option value="brightening">Brightening</option>
                    <option value="anti-aging">Anti-Aging</option>
                    <option value="exfoliating">Exfoliating</option>
                    <option value="hydrating">Hydrating</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Daftar Ingredients</label>
                <textarea rows={4} value={productForm.ingredients_list} onChange={e => setProductForm({...productForm, ingredients_list: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#660033] text-white rounded-lg font-bold hover:bg-[#4A0024]">{isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL TREATMENT (TAMBAH / EDIT)             */}
      {/* ========================================= */}
      {isTreatmentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#3A2E2B]">{treatmentForm.id ? "Edit Treatment" : "Tambah Treatment"}</h2>
              <button onClick={() => setIsTreatmentModalOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSaveTreatment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Nama Treatment</label>
                <input required type="text" value={treatmentForm.treatment_name} onChange={e => setTreatmentForm({...treatmentForm, treatment_name: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Kategori AI</label>
                <select value={treatmentForm.type} onChange={e => setTreatmentForm({...treatmentForm, type: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none">
                    <option value="acne">Acne</option>
                    <option value="brightening">Brightening</option>
                    <option value="anti-aging">Anti-Aging</option>
                    <option value="exfoliating">Exfoliating</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Target & Tujuan</label>
                <textarea required rows={2} value={treatmentForm.benefit} onChange={e => setTreatmentForm({...treatmentForm, benefit: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Metode Medis</label>
                <input required type="text" value={treatmentForm.method} onChange={e => setTreatmentForm({...treatmentForm, method: e.target.value})} className="w-full border rounded-lg p-2 text-sm focus:border-[#660033] outline-none" />
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsTreatmentModalOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#660033] text-white rounded-lg font-bold hover:bg-[#4A0024]">{isSubmitting ? 'Menyimpan...' : 'Simpan Treatment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL TAMBAH DOKTER                       */}
      {/* ========================================= */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-[#3A2E2B]">Tambah Dokter Baru</h2>
              <button onClick={() => setIsDoctorModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
            </div>
            
            <form onSubmit={handleSaveDoctor} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nama Lengkap & Gelar</label>
                <input required type="text" value={doctorForm.name} onChange={e => setDoctorForm({...doctorForm, name: e.target.value})} placeholder="Contoh: dr. Ahmad Faisal, Sp.D.V.E" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#660033] outline-none transition-all" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Spesialisasi</label>
                <input required type="text" value={doctorForm.specialty} onChange={e => setDoctorForm({...doctorForm, specialty: e.target.value})} placeholder="Contoh: Aesthetic Dermatologist" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#660033] outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Jadwal Praktik</label>
                  <input required type="text" value={doctorForm.schedule} onChange={e => setDoctorForm({...doctorForm, schedule: e.target.value})} placeholder="Senin - Jumat" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#660033] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Pengalaman</label>
                  <input required type="text" value={doctorForm.exp} onChange={e => setDoctorForm({...doctorForm, exp: e.target.value})} placeholder="10 Tahun Pengalaman" className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-[#660033] outline-none transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-50">
                <button type="button" onClick={() => setIsDoctorModalOpen(false)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 text-xs transition-all uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-[#660033] text-white rounded-xl font-bold hover:bg-[#4A0024] text-xs transition-all shadow-lg shadow-[#660033]/20 uppercase tracking-widest">
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Dokter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #FDFBF7; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #D2C5B8; border-radius: 10px; }
      `}} />
    </div>
  );
}