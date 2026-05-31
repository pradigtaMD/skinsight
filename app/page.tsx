"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function SkinSight() {
  // ==========================================
  // STATE & REFS
  // ==========================================
  const [currentSlide, setCurrentSlide] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [localProducts, setLocalProducts] = useState<any[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [imgDimensions, setImgDimensions] = useState<{cw: number, ch: number, nw: number, nh: number} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ==========================================
  // VARIABEL API UTAMA
  // ==========================================
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const slides = [
    {
      image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=2000&auto=format&fit=crop",
      textNormal: "Precision Care for",
      textHighlight: "Flawless Skin.",
      desc: "Rasakan pengalaman analisis kulit setara klinis yang ditenagai oleh Kecerdasan Buatan (AI). Temukan rutinitas yang dirancang khusus untuk Anda."
    },
    {
      image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=2000&auto=format&fit=crop",
      textNormal: "Kecantikan Sejati Berawal dari",
      textHighlight: "Kulit yang Sehat.",
      desc: "Kami memahami bahwa setiap kulit memiliki ceritanya sendiri. Biarkan algoritma kami membaca kebutuhan spesifik kulit wajah Anda."
    },
    {
      image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=2000&auto=format&fit=crop",
      textNormal: "Harmoni Antara Sains,",
      textHighlight: "Alam, dan Teknologi.",
      desc: "Menyatukan kemurnian bahan aktif dermatologi dengan ketepatan prediksi Machine Learning untuk hasil yang optimal."
    }
  ];

  const activeSlide = slides[currentSlide] || slides[0];

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentSlide, slides.length]);

  useEffect(() => {
    return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
  }, [stream]);

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [isCameraOpen, stream]);

  const scrollToAnalyzer = () => { document.getElementById('analyzer-section')?.scrollIntoView({ behavior: 'smooth' }); };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
      resetScannerStates();
    } catch (err) {
      alert("Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera di browser.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); }
    setIsCameraOpen(false);
  };

  const resetScannerStates = () => {
    setImage(null);
    setResults(null);
    setLocalProducts([]);
    setImgDimensions(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
            setImage(URL.createObjectURL(file));
            stopCamera();
            processAnalysis(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setResults(null); setLocalProducts([]); setImgDimensions(null);
    processAnalysis(file);
  };

  // ==========================================
  // LOGIKA REKOMENDASI LENGKAP (STRICT CONTENT-BASED FILTERING)
  // ==========================================
  const processAnalysis = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body: formData });
      const data = await response.json();
      
      if (data.status === "success") {
        setResults(data);
        
        const labels = data.detected_problems ? data.detected_problems.map((p: string) => p.toLowerCase()) : [];
        const concernToId: { [key: string]: number } = {
          "acne": 1, 
          "acne_scars": 2, 
          "acne scars": 2, 
          "blackheads": 5, 
          "wrinkles": 6
        };

        const activeCategoryIds = labels.map((l: string) => concernToId[l]).filter((id: number | undefined) => id !== undefined);
        
        const prodResponse = await fetch(`${API_URL}/api/products`);
        
        if (prodResponse.ok) {
          const allProducts = await prodResponse.json();
          let filteredProducts = [];
          
          // ==========================================
          // LOGIKA 1: WAJAH BERSIH (DAILY MAINTENANCE)
          // ==========================================
          if (labels.length === 0) { 
            const dailyClaims = ["daily", "hydrating"];
            filteredProducts = allProducts.filter((p: any) => {
              if (p.is_available === false || p.is_available === 0) return false;
              // Hanya ambil produk dasar
              const basicTypes = ["FACE WASH", "TONER", "SERUM", "MOISTURIZER", "SUNSCREEN", "DAILY"];
              const isBasicType = basicTypes.includes((p.product_type || "").toUpperCase());
              
              // HARUS berlabel daily atau hydrating
              const pClaim = (p.claim_category || "").toLowerCase();
              const isDailyClaim = dailyClaims.some(c => pClaim.includes(c));
              
              return isBasicType && isDailyClaim;
            });
          }
          // ==========================================
          // LOGIKA 2: STRICT CONTENT-BASED FILTERING (UNTUK SKRIPSI)
          // ==========================================
          else {
            filteredProducts = allProducts.filter((p: any) => {
              // 1. Abaikan produk habis
              if (p.is_available === false || p.is_available === 0) return false;
              
              // 2. Cocokkan ID Kategori Kulit (Jika ada di database)
              const matchById = activeCategoryIds.includes(p.skin_category_id);
              
              // 3. Cocokkan Teks Label AI dengan Claim Produk secara KETAT
              const dbClaim = (p.claim_category || "").toLowerCase();
              let matchByText = false;
              
              if (labels.includes("acne") && dbClaim.includes("acne")) matchByText = true;
              if (labels.includes("wrinkles") && dbClaim.includes("anti-aging")) matchByText = true;
              // Untuk Acne Scars, algoritma mencari claim: Brightening, Scar, atau Dark Spot
              if ((labels.includes("acne scars") || labels.includes("acne_scars")) && (dbClaim.includes("brightening") || dbClaim.includes("scar") || dbClaim.includes("dark spot"))) matchByText = true;
              // Untuk Blackheads, algoritma mencari claim: Exfoliating atau Pore
              if (labels.includes("blackheads") && (dbClaim.includes("exfoliating") || dbClaim.includes("pore"))) matchByText = true;
              
              // PRODUK HANYA LOLOS JIKA BENAR-BENAR MATCH (TIDAK ADA PENAMBALAN PRODUK DAILY)
              return matchById || matchByText;
            });
          }

          // ==========================================
          // GROUPING & URUTAN TAMPILAN
          // ==========================================
          const grouped = filteredProducts.reduce((acc: any, curr: any) => {
            const type = (curr.product_type || "EXTRA CARE").toUpperCase(); 
            if (!acc[type]) acc[type] = [];
            acc[type].push(curr); return acc;
          }, {});

          // Pastikan jika ada tahapan yang lolos filter, urutannya tetap benar (CTMP)
          const stepOrder = ["FACE WASH", "TONER", "SERUM", "MOISTURIZER", "SUNSCREEN"];
          const structuredRoutine: any[] = [];

          stepOrder.forEach(step => {
            if (grouped[step]) {
              structuredRoutine.push({ type: step, items: grouped[step] });
              delete grouped[step]; // Hapus agar tidak dobel
            }
          });

          // Masukkan sisa tipe produk (seperti Spot Treatment atau Masker) yang tidak ada di urutan dasar
          Object.keys(grouped).forEach(key => {
            structuredRoutine.push({ type: key, items: grouped[key] });
          });

          setLocalProducts(structuredRoutine); 
        }
      }
    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Koneksi ke backend gagal. Pastikan FastAPI sudah jalan.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#3A2E2B] font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-[100vh] flex items-center overflow-hidden -mt-20 md:-mt-24 pt-20 md:pt-24">
        {slides.map((slide, index) => (
          <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100" : "opacity-0"}`}>
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${slide.image}')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent"></div>
          </div>
        ))}

        <div className="relative z-10 max-w-7xl w-full mx-auto px-6 lg:px-8 pt-10 md:pt-0">
          <div className="max-w-2xl text-left">
            <p className="text-[#A58D87] font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs mb-4 md:mb-6 flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#A58D87]"></span>
              The Future of Dermatology
            </p>
            
            <div className="min-h-[140px] md:min-h-[160px]">
              <h1 className="text-4xl md:text-5xl lg:text-6xl text-[#3A2E2B] font-serif leading-tight mb-4 transition-all duration-700" key={`quote-${currentSlide}`} style={{ fontFamily: 'var(--font-playfair), serif', animation: 'fadeInUp 0.8s ease-out' }}>
                {activeSlide.textNormal} <br className="hidden md:block" />
                <span className="text-[#660033] italic">{activeSlide.textHighlight}</span>
              </h1>
              <p className="text-[#8B736D] text-sm md:text-lg mb-8 leading-relaxed max-w-lg font-light" key={`desc-${currentSlide}`} style={{ animation: 'fadeInUp 1s ease-out' }}>
                {activeSlide.desc}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button onClick={scrollToAnalyzer} className="px-8 py-4 bg-[#660033] text-white rounded-full font-bold shadow-lg shadow-[#660033]/30 hover:bg-[#4A0024] hover:shadow-xl transition-all md:hover:-translate-y-1 flex items-center justify-center gap-2 text-sm md:text-base">
                Mulai Skin Analysis
              </button>
              <Link href="/katalog" className="px-8 py-4 bg-transparent border border-[#D2C5B8] text-[#660033] rounded-full font-bold hover:border-[#660033] hover:bg-[#660033]/5 transition-all text-center text-sm md:text-base">
                Eksplorasi Treatment
              </Link>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 mt-12 md:mt-12">
              {slides.map((_, index) => (
                <button key={index} onClick={() => setCurrentSlide(index)} className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? "w-8 bg-[#660033]" : "w-3 bg-[#D2C5B8] hover:bg-[#A58D87]"}`} aria-label={`Go to slide ${index + 1}`} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. BAGIAN ANALISIS KULIT */}
      <section id="analyzer-section" className="py-16 md:py-20 px-4 md:px-10 max-w-7xl mx-auto relative z-10 scroll-mt-10">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl text-[#660033] mb-4 font-serif" style={{ fontFamily: 'var(--font-playfair), serif' }}>Personalized Routine, Just for You</h2>
          <p className="text-[#8B736D] text-sm md:text-base px-4">Take a photo or upload from gallery to get tailored recommendations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-5 bg-white p-5 md:p-6 rounded-3xl shadow-xl shadow-[#660033]/5 border border-[#EAE3D9] lg:sticky lg:top-32 lg:z-20 transition-all duration-300 flex flex-col">
            <div className="relative w-full overflow-hidden rounded-2xl bg-[#FDFBF7] border-2 border-dashed border-[#D2C5B8] flex flex-col items-center justify-center h-[380px] md:h-[450px] shrink-0">
              {isCameraOpen ? (
                <div className="relative w-full h-full flex flex-col items-center bg-black overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 overflow-hidden">
                    <div className="w-[65%] h-[75%] border-[3px] border-dashed border-white/60 rounded-[100%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                    <span className="absolute bottom-8 md:bottom-10 text-[#FDFBF7] text-[10px] md:text-xs uppercase tracking-widest font-black bg-[#660033]/90 px-5 py-2 rounded-full backdrop-blur-md shadow-lg border border-white/20 text-center animate-pulse">
                      Posisikan Wajah Di Sini
                    </span>
                  </div>
                </div>
              ) : image ? (
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-black">
                  <img 
                    id="preview-image"
                    src={image} 
                    className="w-full h-full object-cover block" 
                    alt="Skin Preview" 
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setImgDimensions({
                        cw: img.clientWidth,
                        ch: img.clientHeight,
                        nw: img.naturalWidth,
                        nh: img.naturalHeight
                      });
                    }}
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-20">
                      <div className="w-10 h-10 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  {!loading && imgDimensions && results?.bounding_boxes?.length > 0 && (() => {
                    const { cw, ch, nw, nh } = imgDimensions;
                    const scale = Math.max(cw / nw, ch / nh);
                    const xOffset = (cw - nw * scale) / 2;
                    const yOffset = (ch - nh * scale) / 2;

                    return results.bounding_boxes.map((det: any, i: number) => {
                      const pixelX = det.x * nw;
                      const pixelY = det.y * nh;
                      const pixelWidth = det.width * nw;
                      const pixelHeight = det.height * nh;

                      const boxLeft = (pixelX - pixelWidth / 2) * scale + xOffset;
                      const boxTop = (pixelY - pixelHeight / 2) * scale + yOffset;
                      const finalBoxWidth = pixelWidth * scale;
                      const finalBoxHeight = pixelHeight * scale;

                      return (
                        <div 
                          key={i} 
                          className="absolute border-2 border-[#660033] bg-[#660033]/20 rounded-sm z-10 shadow-[0_0_8px_rgba(102,0,51,0.4)]" 
                          style={{ left: `${boxLeft}px`, top: `${boxTop}px`, width: `${finalBoxWidth}px`, height: `${finalBoxHeight}px` }}
                        >
                          <span className="absolute -top-6 left-0 bg-[#660033] text-[#FDFBF7] text-[10px] px-2 py-0.5 rounded-md shadow-md font-bold whitespace-nowrap z-20 uppercase tracking-widest">
                            {det.class.replace("_", " ")}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="py-10 md:py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-[#F8F3ED] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-[#A58D87]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path></svg>
                  </div>
                  <h3 className="font-bold text-[#3A2E2B] mb-2">Unggah Foto Wajah</h3>
                  <p className="text-[#8B736D] text-xs md:text-sm font-light px-8 leading-relaxed">
                    Pastikan pencahayaan cukup dan posisikan wajah secara <b className="font-bold text-[#660033]">close-up</b> tanpa riasan (makeup).
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3 shrink-0">
              <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
              {isCameraOpen ? (
                <div className="flex gap-3">
                  <button onClick={stopCamera} className="w-1/3 bg-[#F8F3ED] text-[#660033] py-4 rounded-2xl font-bold hover:bg-[#EAE3D9] transition-all text-sm shadow-sm">Batal</button>
                  <button onClick={capturePhoto} className="w-2/3 bg-[#660033] hover:bg-[#4A0024] text-[#FDFBF7] py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 text-sm md:text-base flex items-center justify-center gap-2">
                    <span className="text-xl">📸</span> Ambil Foto
                  </button>
                </div>
              ) : image ? (
                <button onClick={() => resetScannerStates()} className="w-full bg-[#F8F3ED] text-[#660033] border border-[#D2C5B8] py-4 rounded-2xl font-bold hover:bg-[#EAE3D9] transition-all text-sm md:text-base shadow-sm">
                  Coba Foto Lain
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={startCamera} className="flex-1 bg-[#660033] hover:bg-[#4A0024] text-[#FDFBF7] py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#660033]/20 active:scale-95 flex items-center justify-center gap-2 text-sm">
                    Buka Kamera
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-[#FDFBF7] border-2 border-[#660033] text-[#660033] hover:bg-[#F8F3ED] py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                    Pilih dari Galeri
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-[#660033]/5 border border-[#EAE3D9]">
              <h2 className="text-xl text-[#660033] mb-4 font-serif font-bold" style={{ fontFamily: 'var(--font-playfair), serif' }}>Skin Concerns</h2>
              <div className="flex flex-wrap gap-3">
                {results?.detected_problems?.length > 0 ? (
                  results.detected_problems.map((p: string) => (
                    <span key={p} className="bg-[#F8F3ED] text-[#660033] px-5 py-2 rounded-full text-xs font-bold border border-[#EAE3D9] uppercase tracking-wider">{p.replace("_", " ")}</span>
                  ))
                ) : (
                  <p className="text-[#8B736D] font-light text-sm md:text-base">
                    {results && results.detected_problems?.length === 0 ? "✨ Wajah Anda bersih dan sehat!" : "Your skin concerns will appear here after analysis."}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-[#660033]/5 border border-[#EAE3D9]">
              <h2 className="text-xl text-[#660033] mb-2 font-serif font-bold" style={{ fontFamily: 'var(--font-playfair), serif' }}>
                {results && results.detected_problems?.length === 0 ? "Daily Maintenance" : "Your Daily Routine"}
              </h2>
              
              <div className="mb-6">
                <p className="text-sm text-[#8B736D] mb-3">
                  {results && results.detected_problems?.length === 0 
                    ? "Perawatan dasar harian untuk menjaga kulit tetap bersih dan terlindungi." 
                    : "Pilihan rutinitas skincare berdasarkan kondisi kulit Anda."}
                </p>

                {/* CATATAN PENTING PENGGANTI LABEL EKSKLUSIF */}
                <div className="flex items-start gap-3 bg-[#660033]/5 p-3.5 rounded-xl border border-[#660033]/10">
                  <span className="text-[#660033] text-lg leading-none">💡</span>
                  <p className="text-[10px] md:text-xs text-[#8B736D] leading-relaxed">
                    <span className="font-bold text-[#660033]">Catatan:</span> Rekomendasi mencakup <i>skincare</i> komersial pasaran dan produk <b><i>Medical Grade </i></b> (standar klinik medis) yang diformulasikan khusus untuk perawatan intensif.
                  </p>
                </div>
              </div>
              
              {localProducts.length > 0 ? (
                <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {localProducts.map((category: any, catIdx: number) => {
                    const categoryTitle = (category.type || "").trim().toUpperCase() === "DAILY" ? "DAILY MAINTENANCE" : category.type;
                    
                    return (
                      <div key={catIdx}>
                        <h3 className="text-xs md:text-sm font-bold text-[#A58D87] tracking-[0.2em] mb-4 border-b border-[#EAE3D9] pb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#660033]"></span> STEP: {categoryTitle}
                        </h3>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5">
                          {category.items.map((item: any, idx: number) => {
                           const productLabel = (item.product_type || "").trim().toUpperCase() === "DAILY" ? "DAILY MAINTENANCE" : item.product_type;

                            return (
                              <div key={idx} className="group relative p-4 rounded-2xl bg-[#FDFBF7] border border-[#EAE3D9] hover:shadow-lg transition-all overflow-hidden cursor-pointer flex flex-col h-full min-h-[140px]">
                                
                                <div className="transition-opacity duration-500 group-hover:opacity-0 flex items-center gap-4 h-full">
                                  <div className="w-20 h-24 md:w-24 md:h-28 shrink-0 bg-white rounded-xl border border-[#EAE3D9] p-2 flex items-center justify-center overflow-hidden shadow-inner">
                                    <img 
                                      src={item.image_url ? (item.image_url.includes('localhost') ? item.image_url.replace('http://localhost:8000', API_URL) : item.image_url) : "https://via.placeholder.com/150"} 
                                      alt={item.product_name} 
                                      className="w-full h-full object-contain mix-blend-multiply"
                                    />
                                  </div>

                                  <div className="flex flex-col flex-1 h-full justify-center">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                      {/* Nama tipe produk dikembalikan seperti asli (FACE WASH, SERUM, dll) */}
                                      <p className="text-[9px] md:text-[10px] font-bold text-[#A58D87] uppercase tracking-[0.2em]">{item.product_type}</p>
                                      
                                      {/* DI SINI PERUBAHANNYA: Jika claim dari database adalah "Daily", ubah jadi "DAILY MAINTENANCE" */}
                                      {item.claim_category && (
                                        <span className="bg-[#660033]/10 text-[#660033] px-2 py-0.5 rounded text-[8px] md:text-[9px] font-black uppercase tracking-wider border border-[#660033]/20">
                                          {item.claim_category.split(' &')[0].trim().toUpperCase() === "DAILY" 
                                            ? "DAILY MAINTENANCE" 
                                            : item.claim_category.split(' &')[0]}
                                        </span>
                                      )}
                                    </div>
                                    {/* --- KODE TANDA / BADGE CLINIC GRADE OTOMATIS --- */}
                                    {["dermaxp", "theraskin", "topicare", "melanox", "parasol", "acnacare"].includes((item.brand || "").toLowerCase()) && (
                                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#660033] to-[#8B736D] text-white px-2 py-0.5 rounded text-[8px] md:text-[9px] font-bold uppercase tracking-widest shadow-sm w-fit mb-1.5">
                                        ✦ Medical Grade
                                      </span>
                                    )}

                                    <p className="font-bold text-[#3A2E2B] text-sm md:text-base leading-snug mb-1 line-clamp-2">{item.product_name}</p>
                                    <p className="text-[10px] md:text-xs text-[#8B736D] mb-2">{item.brand}</p>
                                    <p className="text-[#660033] font-bold text-xs md:text-sm mt-auto">
                                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price)}
                                    </p>
                                  </div>
                                </div>

                                <div className="absolute inset-0 bg-[#660033] text-[#FDFBF7] p-4 md:p-6 flex flex-col justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 overflow-y-auto">
                                  <p className="text-[9px] md:text-[10px] font-bold text-[#EAE3D9] uppercase tracking-wider mb-2">Bahan Utama</p>
                                  <p className="text-[10px] md:text-xs font-light leading-relaxed line-clamp-6">{item.ingredients_list}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-[#8B736D] italic bg-[#FDFBF7] p-6 rounded-2xl border border-dashed border-[#D2C5B8] text-center text-sm">Waiting for your beautiful face...</p>}
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-[#660033]/5 border border-[#EAE3D9]">
              <h2 className="text-xl text-[#660033] mb-6 font-serif font-bold" style={{ fontFamily: 'var(--font-playfair), serif' }}>Clinic Treatments</h2>
              
              {results?.recommendations?.treatments?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  {results.recommendations.treatments.map((item: any, idx: number) => (
                    <div key={idx} className="group flex flex-col p-5 md:p-6 rounded-3xl border border-[#EAE3D9] bg-[#FDFBF7] hover:bg-white hover:shadow-xl hover:shadow-[#660033]/5 hover:border-[#660033]/30 transition-all duration-500 hover:-translate-y-1">
                      
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#EAE3D9] text-[#A58D87] flex items-center justify-center font-bold text-xl group-hover:bg-[#660033] group-hover:text-white group-hover:border-[#660033] transition-all shadow-sm shrink-0">
                          ✦
                        </div>
                        <div className="pt-0.5">
                          <span className="text-[9px] md:text-[10px] font-bold text-[#A58D87] uppercase tracking-widest block mb-1">
                            {item.type || "CLINIC CARE"}
                          </span>
                          {/* PERBAIKAN: Menggunakan item.name sesuai nama kolom di database */}
                          <h3 className="font-bold text-[#3A2E2B] text-base md:text-lg leading-tight">
                            {item.name}
                          </h3>
                        </div>
                      </div>

                      <div className="mb-6 flex-1">
                        <p className="text-xs md:text-sm text-[#8B736D] font-light leading-relaxed line-clamp-3">
                          <span className="font-semibold text-[#660033]">Target Utama:</span> {item.benefit}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-[#EAE3D9]/80 flex flex-col gap-2.5">
                        
                        <div className="flex items-center text-[11px] md:text-xs">
                          <span className="font-bold text-[#A58D87] uppercase tracking-wider w-[60px] shrink-0">Metode</span>
                          <span className="text-[#A58D87] mr-2">:</span>
                          <span className="text-[10px] md:text-xs text-[#3A2E2B] font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100 capitalize">
                            {item.method || "Tindakan Medis"}
                          </span>
                        </div>

                        <div className="flex items-center text-[11px] md:text-xs">
                          <span className="font-bold text-[#A58D87] uppercase tracking-wider w-[60px] shrink-0">Estimasi</span>
                          <span className="text-[#A58D87] mr-2">:</span>
                          <span className="font-bold text-[#660033]">
                            {item.price ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.price) : 'Hubungi Klinik'}
                          </span>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#8B736D] italic bg-[#FDFBF7] p-6 rounded-2xl border border-dashed border-[#D2C5B8] text-center text-sm">
                  {results ? "Tidak ada treatment medis khusus yang disarankan." : "Waiting for your beautiful face..."}
                </p>
              )}
            </div>

            {/* TOMBOL LANJUT KONSULTASI YANG KEMBALI DIMUNCULKAN */}
            {results && (
              <div className="mt-8 bg-[#660033]/5 border border-[#660033]/20 rounded-3xl p-6 md:p-8 text-center shadow-inner">
                <h3 className="text-lg md:text-xl font-bold text-[#660033] mb-2 font-serif">Butuh Penanganan Lebih Lanjut?</h3>
                <p className="text-xs md:text-sm text-[#8B736D] mb-5 max-w-sm mx-auto">Dapatkan resep medis yang akurat dan tindakan langsung dari dokter spesialis estetika kami.</p>
                <Link href="/klinik" className="inline-block w-full md:w-auto px-8 py-3.5 bg-[#660033] text-white font-bold rounded-xl shadow-lg hover:bg-[#4A0024] transition-all text-xs uppercase tracking-widest">
                  Lanjut Konsultasi Dokter
                </Link>
              </div>
            )}

          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #FDFBF7; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #EAE3D9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D2C5B8; }
      `}} />
    </main>
  );
}