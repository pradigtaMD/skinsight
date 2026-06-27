"use client";
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  status: string;
  image: string;
}

export default function KlinikPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // VARIABEL API UTAMA (VERCEL DYNAMIC URL)
  // ==========================================
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Mengambil tanggal hari ini untuk membatasi input masa lalu
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patient_name: '',
    booking_date: '',
    session_time: 'Pagi (09:00 - 12:00)',
    keluhan: ''
  });

  // ==========================================
  // FUNGSI SAKTI: Memperbaiki Link Foto localhost
  // ==========================================
  const getFixedImgUrl = (url: string) => {
    if (!url) return "https://via.placeholder.com/150";
    if (url.includes("localhost:8000")) {
      return url.replace("http://localhost:8000", API_URL);
    }
    return url;
  };

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch(`${API_URL}/api/doctors`);
        const result = await response.json();
        if (result.status === "success") {
          setDoctors(result.data);
          // Auto-select dokter pertama yang available
          const availableDoc = result.data.find((d: Doctor) => d.status === 'Available');
          if (availableDoc) setSelectedDoctor(availableDoc);
        }
      } catch (error) {
        console.error("Gagal mengambil data dokter:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ==========================================
    // 1. PREMIUM ALERT: PERINGATAN (Belum Pilih Dokter)
    // ==========================================
    if (!selectedDoctor) {
      Swal.fire({
        html: `
          <div class="flex flex-col items-center text-center p-2">
            <div class="w-16 h-[1px] bg-[#C5A065] opacity-50 mb-8"></div>
            
            <div class="flex items-center justify-center w-20 h-20 rounded-full bg-[#660033]/5 border border-[#660033]/10 mb-8 shadow-inner">
              <svg class="w-10 h-10 text-[#660033]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            
            <h3 class="font-serif text-3xl text-[#3A2E2B] leading-snug mb-3">Pilih<br/><span class="italic text-[#660033]">Dokter Spesialis</span></h3>
            <p class="text-xs text-[#8B736D] leading-relaxed max-w-xs mx-auto">Silakan klik pada panel dokter sebelah kiri untuk menentukan jadwal konsultasi Anda.</p>
          </div>
        `,
        background: '#FDFBF7',
        backdrop: 'rgba(102, 0, 51, 0.4)',
        confirmButtonText: 'MENGERTI',
        buttonsStyling: false,
        allowOutsideClick: false,
        customClass: {
          popup: 'rounded-[3rem] border border-[#EAE3D9] shadow-[0_20px_60px_rgba(102,0,51,0.1)] pb-8 pt-6',
          confirmButton: 'mt-8 bg-[#660033] text-white px-10 py-3.5 rounded-xl font-black tracking-[0.2em] text-[10px] uppercase hover:bg-[#4A0024] transition-all shadow-lg shadow-[#660033]/20 active:scale-95'
        }
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const combinedSessionData = `${formData.session_time} | Keluhan: ${formData.keluhan || 'Tidak ada'}`;
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          patient_name: formData.patient_name,
          booking_date: formData.booking_date,
          session_time: combinedSessionData
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.status === "success") {
        // ==========================================
        // 2. PREMIUM ALERT: SUKSES (Durasi 7 Detik)
        // ==========================================
        let timeLeft = 7;

        Swal.fire({
          html: `
            <div class="flex flex-col items-center p-2">
              <div class="w-20 h-[1px] bg-[#C5A065] mb-8 opacity-60"></div>
              
              <div class="flex items-center justify-center w-20 h-20 rounded-full border border-[#25D366]/20 mb-8 bg-white shadow-xl shadow-[#25D366]/5 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25D366]/10 opacity-75"></span>
                <svg class="w-10 h-10 text-[#25D366] relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
              </div>
              
              <div class="text-center px-4 w-full">
                <p class="text-[10px] uppercase tracking-[0.3em] text-[#660033] font-black mb-2 opacity-70">SkinSight Reservation</p>
                <h3 class="font-serif text-3xl md:text-4xl text-[#3A2E2B] leading-tight mb-6">Reservasi<br/><span class="italic font-normal">Berhasil!</span></h3>
                
                <div class="w-full h-[1px] bg-[#EAE3D9] mb-6"></div>
                
                <p class="text-[11px] md:text-sm text-[#8B736D] leading-relaxed mb-6">
                  Jadwal konsultasi eksklusif Anda bersama<br/> 
                  <b class="text-[#3A2E2B] text-sm md:text-base">${selectedDoctor.name}</b><br/>
                  telah berhasil dicatat oleh sistem.
                </p>
                
                <div class="bg-gray-50 border border-[#EAE3D9] p-4 rounded-2xl w-full flex flex-col items-center gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-[#25D366] animate-pulse">💬</span>
                    <p class="text-[9px] md:text-[10px] text-[#8B736D] tracking-wider uppercase font-bold">
                      Mengalihkan otomatis dalam <b id="countdown" class="text-sm text-[#660033] font-black">${timeLeft}</b> detik
                    </p>
                  </div>
                  
                  <a href="${data.whatsapp_url}" target="_blank" rel="noreferrer" class="w-full bg-[#25D366] text-white py-2.5 rounded-xl text-[9px] font-black tracking-widest uppercase hover:bg-[#1EBE59] transition-all text-center shadow-md">
                    Buka WhatsApp Sekarang
                  </a>
                </div>
              </div>
            </div>
          `,
          background: '#FDFBF7',
          backdrop: 'rgba(102, 0, 51, 0.6)',
          showConfirmButton: false,
          timer: timeLeft * 1000,
          timerProgressBar: true,
          allowOutsideClick: false,
          customClass: {
            popup: 'rounded-[3rem] border-2 border-[#660033]/5 shadow-[0_30px_80px_rgba(102,0,51,0.2)] pb-8 pt-6 overflow-visible w-full max-w-[340px] md:max-w-[400px]',
            timerProgressBar: 'bg-[#25D366] h-1.5 rounded-full'
          },
          didOpen: () => {
            const container = Swal.getHtmlContainer();
            const b = container ? container.querySelector('#countdown') : null;
            
            const timerInterval = setInterval(() => {
              timeLeft -= 1;
              if (b && timeLeft > 0) {
                b.textContent = timeLeft.toString();
              } else {
                clearInterval(timerInterval);
              }
            }, 1000);
          }
        }).then(() => {
          setFormData({ patient_name: '', booking_date: '', session_time: 'Pagi (09:00 - 12:00)', keluhan: '' });
          window.open(data.whatsapp_url, "_blank");
        });

      } else {
        // ==========================================
        // 3. PREMIUM ALERT: GAGAL (Ditolak Backend)
        // ==========================================
        Swal.fire({
          html: `
            <div class="flex flex-col items-center p-2 text-center">
              <div class="w-16 h-[1px] bg-red-200 opacity-60 mb-8"></div>
              
              <div class="flex items-center justify-center w-20 h-20 rounded-full bg-red-50 border border-red-100 mb-8 shadow-inner shadow-red-500/5">
                <svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              
              <h3 class="font-serif text-3xl text-red-700 leading-tight mb-3">Gagal<br/><span class="italic text-[#3A2E2B]">Memproses</span></h3>
              <p class="text-xs text-red-500/80 leading-relaxed max-w-xs mx-auto">${data.detail || 'Terjadi kesalahan internal pada sistem reservasi.'}</p>
            </div>
          `,
          background: '#FDFBF7',
          backdrop: 'rgba(102, 0, 51, 0.5)',
          confirmButtonText: 'TUTUP',
          buttonsStyling: false,
          customClass: {
            popup: 'rounded-[3rem] border border-red-100 shadow-2xl shadow-red-900/10 pb-8 pt-6 w-full max-w-[340px] md:max-w-[400px]',
            confirmButton: 'mt-8 bg-red-600 text-white px-10 py-3.5 rounded-xl font-black tracking-widest text-[10px] uppercase hover:bg-red-700 transition-all shadow-lg active:scale-95'
          }
        });
      }
    } catch (error) {
      Swal.fire({
        title: 'Koneksi Terputus',
        text: 'Gagal terhubung ke server SkinSight.',
        icon: 'error',
        confirmButtonColor: '#660033'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        const formElement = document.getElementById('booking-form');
        if (formElement) {
          const yOffset = -80; 
          const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] -mt-16 md:-mt-20 pt-28 md:pt-36">      
      {/* 1. HERO & LOCATION SECTION */}
      <section className="px-5 md:px-10 max-w-7xl mx-auto mb-10 md:mb-16">
        <div className="text-center md:text-left mb-8 md:mb-10">
          <p className="text-[#660033] font-black tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs mb-3 uppercase opacity-80">
            SkinSight Center
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-6xl text-[#660033] font-serif leading-tight mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
            Meet Our <span className="italic text-[#3A2E2B]">Specialists</span>
          </h1>
        </div>

        <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 sm:p-6 md:p-10 border border-[#EAE3D9] shadow-xl shadow-[#660033]/5 flex flex-col lg:flex-row items-center gap-5 md:gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 md:w-64 md:h-64 bg-[#F8F3ED] rounded-full -mr-20 -mt-20 md:-mr-32 md:-mt-32 opacity-40"></div>
          
          <div className="flex-1 relative z-10 w-full">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3 md:mb-4">
              <span className="w-8 md:w-10 h-[1px] bg-[#660033]"></span>
              <span className="text-[#660033] text-[9px] md:text-[10px] font-black uppercase tracking-widest">Pusat Estetika</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#3A2E2B] mb-4 text-center md:text-left">SkinSight Derma Clinic</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
              <div className="flex gap-2.5 md:gap-3 items-start bg-gray-50/50 p-3 rounded-xl md:bg-transparent md:p-0">
                <span className="text-lg md:text-xl">📍</span>
                <p className="text-[#8B736D] text-[10px] md:text-sm leading-relaxed">
                  Jl. Localhost Raya No. 8080, <br className="hidden md:block" /> Kota Palu, Sulawesi Tengah 94111
                </p>
              </div>
              <div className="flex gap-2.5 md:gap-3 items-start bg-gray-50/50 p-3 rounded-xl md:bg-transparent md:p-0">
                <span className="text-lg md:text-xl">🕒</span>
                <div>
                  <p className="text-[#3A2E2B] text-[10px] md:text-sm font-bold">Jam Operasional</p>
                  <p className="text-[#8B736D] text-[10px] md:text-xs">Setiap Hari (10.00 - 21.00 WITA)</p>
                </div>
              </div>
            </div>
          </div>

          <a href="https://maps.google.com/?q=Jl.+Puebongo+I,+Boyaoge,+Palu" target="_blank" rel="noreferrer" className="w-full lg:w-auto relative z-10 px-6 md:px-8 py-3.5 md:py-4 bg-[#660033] text-white rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold tracking-widest hover:bg-[#4A0024] transition-all text-center shadow-lg shadow-[#660033]/20 uppercase">
            LIHAT MAPS
          </a>
        </div>
      </section>

      {/* 2. MAIN CONTENT GRID AREA */}
      <div className="max-w-7xl mx-auto px-5 md:px-10 mb-16 md:mb-20">
        
        {/* GARIS PEMBATAS */}
        <div className="w-full mb-6 md:mb-10">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-[#660033]"></span>
            <h2 className="text-lg md:text-2xl font-serif font-bold text-[#660033]" style={{ fontFamily: 'var(--font-playfair)' }}>
              Physicians on Duty
            </h2>
          </div>
          <div className="w-full h-[1px] bg-[#EAE3D9] opacity-70"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* KOLOM KIRI: DAFTAR DOKTER */}
          <div className="lg:col-span-7 xl:col-span-8">
            {isLoading ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
                {doctors.map((doc) => {
                const isAvailable = doc.status === 'Available';
                const isSelected = selectedDoctor?.id === doc.id;
                
                return (
                  <div 
                    key={doc.id} 
                    onClick={() => isAvailable && handleSelectDoctor(doc)} 
                    className={`relative group rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border-2 transition-all duration-500 flex flex-col items-center text-center 
                      ${isAvailable ? 'cursor-pointer bg-white' : 'cursor-not-allowed bg-gray-50/50'} 
                      ${isSelected ? 'border-[#660033] shadow-[0_20px_50px_rgba(102,0,51,0.15)] -translate-y-1 md:-translate-y-2' : isAvailable ? 'border-[#EAE3D9] hover:border-[#660033]/40 hover:-translate-y-1' : 'border-gray-200'}`}
                  >
                    {/* Checkmark Card */}
                    <div className={`absolute -top-2 -right-2 md:-top-3 md:-right-3 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-500 z-20 shadow-lg ${isSelected ? 'bg-[#660033] scale-100' : 'bg-gray-200 scale-0'}`}>
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>

                    {/* FOTO DOKTER & BADGE */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mb-5 md:mb-8 mt-2">
                      <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-700 ${isSelected ? 'border-[#660033] scale-110 animate-spin-slow' : !isAvailable ? 'border-gray-300' : 'border-[#D2C5B8]'} `}></div>
                      {/* PENERAPAN FUNGSI FOTO */}
                      <img src={getFixedImgUrl(doc.image)} className={`w-full h-full object-cover rounded-full p-1.5 md:p-2 ${!isAvailable && 'grayscale opacity-70'}`} alt={doc.name} />
                      
                      <div className={`absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 md:px-3 md:py-1.5 rounded-full shadow-md border flex items-center gap-1.5 whitespace-nowrap z-10 ${!isAvailable ? 'bg-white border-red-100' : 'bg-white border-[#EAE3D9]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-[#25D366] animate-pulse' : 'bg-red-500'}`}></span>
                        <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${isAvailable ? 'text-[#25D366]' : 'text-red-500'}`}>
                          {isAvailable ? 'Available' : 'Off Duty'}
                        </span>
                      </div>
                    </div>

                    <h3 className={`font-bold text-base md:text-xl mb-1 ${!isAvailable ? 'text-gray-400' : isSelected ? 'text-[#660033]' : 'text-[#3A2E2B]'}`}>{doc.name}</h3>
                    <p className={`text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black mb-4 md:mb-6 ${!isAvailable ? 'text-gray-300' : 'text-[#A58D87]'}`}>{doc.specialty}</p>

                    <div className="mt-auto w-full">
                      <div className={`w-full py-2.5 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] tracking-widest uppercase border-2 transition-all 
                        ${!isAvailable ? 'bg-gray-100 text-red-500 border-gray-200' 
                        : isSelected ? 'bg-[#660033] text-white border-[#660033]' 
                        : 'bg-transparent text-[#8B736D] border-[#EAE3D9]'}`}
                      >
                        {!isAvailable ? 'TIDAK TERSEDIA' : isSelected ? 'DOKTER TERPILIH ✓' : 'PILIH DOKTER'}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>

          {/* KOLOM KANAN: FORM BOOKING (STICKY) */}
          <div id="booking-form" className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32 z-30 h-fit mt-2 lg:mt-0">
            <div className="bg-[#660033] text-[#FDFBF7] p-5 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-[#660033]/30 border border-[#4A0024] relative overflow-hidden">
              <h2 className="text-xl md:text-3xl font-serif mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Reservation</h2>
              <p className="text-[9px] md:text-xs text-white/70 mb-5 md:mb-8 uppercase tracking-widest">
                Consult with <span className="text-white font-bold">{selectedDoctor?.name || '...'}</span>
              </p>
              
              <form onSubmit={handleSubmitBooking} className="space-y-3.5 md:space-y-5">
                <div className="space-y-1 md:space-y-1.5">
                  <label className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Nama Pasien</label>
                  <input type="text" required value={formData.patient_name} onChange={(e) => setFormData({...formData, patient_name: e.target.value})} placeholder="Nama lengkap Anda" className="w-full px-3 py-3 md:px-4 md:py-4 rounded-xl md:rounded-2xl bg-white/10 border border-white/10 text-white outline-none text-xs md:text-sm placeholder:text-white/30" />
                </div>
                
                <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                  <div className="space-y-1 md:space-y-1.5">
                    <label className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Tanggal</label>
                    <input type="date" required min={today} value={formData.booking_date} onChange={(e) => setFormData({...formData, booking_date: e.target.value})} className="w-full px-2.5 py-3 md:px-4 md:py-4 rounded-xl md:rounded-2xl bg-white/10 border border-white/10 text-white text-[10px] md:text-xs [color-scheme:dark]" />
                  </div>
                  <div className="space-y-1 md:space-y-1.5">
                    <label className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Waktu Sesi</label>
                    <select value={formData.session_time} onChange={(e) => setFormData({...formData, session_time: e.target.value})} className="w-full px-2.5 py-3 md:px-4 md:py-4 rounded-xl md:rounded-2xl bg-white/10 border border-white/10 text-white text-[10px] md:text-xs outline-none appearance-none">
                      <option className="text-black" value="Pagi (09:00 - 12:00)">Pagi (09:00 - 12:00)</option>
                      <option className="text-black" value="Siang (13:00 - 15:00)">Siang (13:00 - 15:00)</option>
                      <option className="text-black" value="Sore (16:00 - 19:00)">Sore (16:00 - 19:00)</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1 md:space-y-1.5">
                  <label className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-white/60 ml-1">Keluhan (Opsional)</label>
                  <textarea rows={2} value={formData.keluhan} onChange={(e) => setFormData({...formData, keluhan: e.target.value})} placeholder="Tuliskan kondisi kulit atau keluhan..." className="w-full px-3 py-3 md:px-4 md:py-4 rounded-xl md:rounded-2xl bg-white/10 border border-white/10 text-white resize-none text-[10px] md:text-sm placeholder:text-white/30"></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={!selectedDoctor || isSubmitting} 
                  className={`w-full py-3.5 md:py-5 rounded-xl md:rounded-2xl font-black transition-all shadow-xl mt-2 text-[9px] md:text-[11px] tracking-[0.1em] md:tracking-[0.2em] uppercase active:scale-95 flex items-center justify-center gap-2 
                  ${!selectedDoctor ? 'bg-white/5 text-white/20' : 'bg-[#25D366] text-white hover:bg-[#1EBE59]'}`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 md:w-5 md:h-5 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825.001 6.938 3.113 6.938 6.938-.001 3.825-3.114 6.938-6.938 6.938z"/></svg>
                      Konfirmasi WhatsApp
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* 3. SECTION FAQ */}
<section className="pt-16 pb-32 md:pt-32 md:pb-32 bg-[#660033] border-t-4 border-[#4A0024] relative overflow-hidden flex flex-col justify-center">        <div className="max-w-4xl mx-auto px-5 md:px-6 relative z-10">
          
          <div className="text-center mb-10 md:mb-16 relative">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] md:text-[10rem] font-black text-white/5 uppercase tracking-normal md:tracking-[0.1em] pointer-events-none select-none z-0 whitespace-nowrap">
              QUESTIONS
            </span>
            <div className="relative z-10">
              <p className="text-white/60 font-bold tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-xs mb-3 uppercase">Medical Support</p>
              <h2 className="text-3xl md:text-5xl font-serif text-white mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>
                Informasi <span className="italic text-[#EAE3D9]">Pelayanan</span>
              </h2>
              <div className="w-16 md:w-20 h-1.5 bg-[#EAE3D9] mx-auto rounded-full mt-4 md:mt-6"></div>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            {[
              { q: "Bolehkah saya datang hanya untuk membeli skincare?", a: "Sangat boleh. Di Klinik, Anda dapat berkonsultasi dengan dokter untuk mendapatkan resep skincare medis tanpa harus mengambil tindakan treatment klinis." },
              { q: "Dari mana data produk di katalog ini berasal?", a: "Seluruh produk dalam katalog kami adalah produk medis pilihan yang telah divalidasi komposisi bahan dan keamanannya oleh tim dermatologi internal Klinik." },
              { q: "Apakah Reservasi WhatsApp ini bersifat final?", a: "Tim kami akan memverifikasi ketersediaan jadwal dokter dan mengonfirmasi reservasi Anda kembali melalui balasan chat WhatsApp." }
            ].map((faq, i) => (
              <div key={i} className="p-5 sm:p-6 md:p-8 bg-white rounded-[1.5rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-start gap-4 md:gap-5 shadow-2xl shadow-black/20 hover:scale-[1.01] transition-transform">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#660033] text-white flex items-center justify-center shrink-0 font-bold shadow-lg shadow-[#660033]/20 text-sm md:text-base">0{i+1}</div>
                <div>
                  <h4 className="font-bold text-[#660033] text-sm md:text-lg mb-1.5 md:mb-2">{faq.q}</h4>
                  <p className="text-[11px] md:text-sm text-[#8B736D] leading-relaxed font-light">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
      `}} />
    </main>
  );
}