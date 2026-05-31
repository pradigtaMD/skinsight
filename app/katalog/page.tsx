"use client";
import { useState, useEffect } from 'react';

export default function KatalogPage() {
  const [activeTab, setActiveTab] = useState<'treatment' | 'skincare'>('treatment');
  
  // STATE PENCARIAN (Harus di dalam komponen)
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk Treatment
  const [treatments, setTreatments] = useState<any[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(true);

  // State untuk Skincare
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string>('All');

  // Fetch Treatments
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        const response = await fetch('http://192.168.100.87:8000/api/treatments/all');
        const data = await response.json();
        setTreatments(data);
      } catch (error) {
        console.error("Gagal memuat treatment:", error);
      } finally {
        setLoadingTreatments(false);
      }
    };
    fetchTreatments();
  }, []);

  // Fetch Products
  useEffect(() => {
    if (activeTab === 'skincare' && products.length === 0) {
      const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
          // PERBAIKAN: Disamakan menggunakan 127.0.0.1 agar mencegah error CORS
          const response = await fetch('http://192.168.100.87:8000/api/products');
          const data = await response.json();
          setProducts(data);
        } catch (error) {
          console.error("Gagal memuat produk:", error);
        } finally {
          setLoadingProducts(false);
        }
      };
      fetchProducts();
    }
  }, [activeTab, products.length]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  // --- LOGIKA FILTER PENCARIAN (SUDAH DISESUAIKAN DENGAN DATABASE) ---

  // Filter Treatment berdasarkan Search
  const searchedTreatments = treatments.filter((t: any) => {
    const query = searchQuery.toLowerCase();
    return (
      (t.treatment_name || t.name || '').toLowerCase().includes(query) ||
      (t.benefit || t.tujuan || '').toLowerCase().includes(query) ||
      (t.method || t.metode || '').toLowerCase().includes(query)
    );
  });

  // Filter Skincare berdasarkan Claim AND Search
  const filteredProducts = products.filter((p: any) => {
    const query = searchQuery.toLowerCase();
    // PERBAIKAN: Baca claim_category atau ingredients_category
    const claim = p.claim_category || p.ingredients_category || ''; 
    const matchClaim = selectedClaim === 'All' || claim.toLowerCase().includes(selectedClaim.toLowerCase());
    const matchSearch = (p.product_name || '').toLowerCase().includes(query) || (p.brand || '').toLowerCase().includes(query);
    return matchClaim && matchSearch;
  });

  // Kelompokkan produk yang sudah terfilter
  const groupedProducts = filteredProducts.reduce((acc: any, product: any) => {
    const type = product.product_type || "Other Skincare"; 
    if (!acc[type]) acc[type] = [];
    acc[type].push(product);
    return acc;
  }, {});

  // PERBAIKAN: Pastikan array claim terbaca sempurna untuk opsi Dropdown
  const uniqueClaims = ['All', ...Array.from(new Set(products.map(p => p.claim_category || p.ingredients_category).filter(Boolean)))];

  return (
    <main className="min-h-screen bg-[#FDFBF7] -mt-16 md:-mt-20 pt-20 md:pt-28 pb-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-4 md:mb-6 text-center md:text-left">
          <p className="text-[#A58D87] font-bold tracking-[0.2em] text-[9px] md:text-xs mb-2 uppercase">
            Curated For You
          </p>
          <h1 className="text-3xl md:text-5xl text-[#3A2E2B] font-serif leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
            Treatment & Skincare
          </h1>
          <p className="mt-2 md:mt-3 text-[#8B736D] text-sm md:text-base max-w-2xl mx-auto md:mx-0 font-light leading-relaxed">
            Temukan tindakan klinis atau rangkaian skincare yang dirancang khusus untuk Anda.
          </p>
        </header>

        {/* --- TAB TOGGLE --- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 md:mb-12">
          
          <div className="bg-white p-1.5 rounded-full border border-[#EAE3D9] inline-flex shadow-sm w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => { setActiveTab('treatment'); setSearchQuery(''); }}
              className={`px-5 md:px-8 py-2.5 md:py-3 rounded-full text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap flex-1 md:flex-none ${
                activeTab === 'treatment' ? "bg-[#660033] text-white shadow-md" : "text-[#8B736D] hover:text-[#660033]"
              }`}
            >
              TREATMENT KLINIS
            </button>
            <button
              onClick={() => { setActiveTab('skincare'); setSearchQuery(''); }}
              className={`px-5 md:px-8 py-2.5 md:py-3 rounded-full text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap flex-1 md:flex-none ${
                activeTab === 'skincare' ? "bg-[#660033] text-white shadow-md" : "text-[#8B736D] hover:text-[#660033]"
              }`}
            >
              SKINCARE KLINIK
            </button>
          </div>

          {/* --- KOLOM PENCARIAN --- */}
          <div className="w-full md:w-80 relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#8B736D] group-focus-within:text-[#660033] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={activeTab === 'treatment' ? "Cari treatment..." : "Cari produk atau brand..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-10 pr-10 bg-white border border-[#EAE3D9] rounded-full text-xs text-[#3A2E2B] placeholder:text-[#A58D87] outline-none focus:border-[#660033] focus:ring-2 focus:ring-[#660033]/10 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B736D] hover:text-[#660033]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

        </div>

        {/* --- KONTEN TAB TREATMENT --- */}
        {activeTab === 'treatment' && (
          <div>
            {loadingTreatments ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : searchedTreatments.length === 0 ? (
              <div className="text-center py-20 text-[#8B736D]">
                <p>Treatment "{searchQuery}" tidak ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
                {searchedTreatments.map((t: any, i: number) => (
                  <div key={i} className="group flex flex-row gap-4 md:gap-6 p-5 md:p-8 bg-white rounded-3xl md:rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-[#660033]/5 border border-[#EAE3D9] hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-500">
                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-[#F8F3ED] flex items-center justify-center text-xl md:text-3xl group-hover:bg-[#660033] group-hover:text-white transition-all shrink-0">
                      {t.type?.toLowerCase().includes('acne') ? '✨' : t.type?.toLowerCase().includes('wrinkle') ? '⏳' : '🧪'}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="text-[8px] md:text-[10px] font-bold text-[#A58D87] uppercase tracking-[0.2em] block mb-1">
                        {t.type || t.category || "CLINIC TREATMENT"}
                      </span>
                      <h3 className="text-lg md:text-2xl font-bold text-[#3A2E2B] mb-2 leading-tight">
                        {t.treatment_name || t.name}
                      </h3>
                      <div className="space-y-1.5 md:space-y-2 mb-4">
                        <p className="text-[#8B736D] text-[11px] md:text-sm font-light leading-relaxed line-clamp-2 md:line-clamp-none">
                          <span className="font-bold text-[#660033]">Tujuan:</span> {t.benefit || t.tujuan}
                        </p>
                        <p className="text-[#8B736D] text-[11px] md:text-sm font-light leading-relaxed line-clamp-2 md:line-clamp-none">
                          <span className="font-bold text-[#660033]">Metode:</span> {t.method || t.metode}
                        </p>
                      </div>
                      
                      {/* --- TAMBAHAN HARGA TREATMENT DI SINI --- */}
                      <div className="mt-auto pt-4 border-t border-[#EAE3D9]/50 flex justify-between items-center">
                        <span className="text-[9px] md:text-[10px] font-bold text-[#A58D87] uppercase tracking-widest">Estimasi Biaya</span>
                        <span className="text-sm md:text-base font-black text-[#660033] bg-[#660033]/5 px-3 py-1.5 rounded-lg border border-[#660033]/10">
                          {t.price ? formatRupiah(t.price) : 'Hubungi Klinik'}
                        </span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- KONTEN TAB SKINCARE --- */}
        {activeTab === 'skincare' && (
          <div>
            <div className="mb-8 md:mb-12 p-5 md:p-6 bg-white rounded-2xl md:rounded-3xl border border-[#EAE3D9] shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <h3 className="font-bold text-[#3A2E2B] text-sm md:text-base mb-1">Rekomendasi Cerdas</h3>
                <p className="text-[11px] md:text-xs text-[#8B736D]">Filter produk berdasarkan kebutuhan kulit Anda</p>
              </div>
              <select 
                value={selectedClaim}
                onChange={(e) => setSelectedClaim(e.target.value)}
                className="w-full sm:w-auto md:w-64 bg-[#FDFBF7] border border-[#EAE3D9] text-[#3A2E2B] text-[11px] md:text-sm rounded-xl focus:ring-[#660033] focus:border-[#660033] block p-3 outline-none cursor-pointer"
              >
                {uniqueClaims.map((claim, idx) => (
                  <option key={idx} value={claim}>
                    {claim === 'All' ? 'Semua Masalah Kulit' : claim}
                  </option>
                ))}
              </select>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 md:w-12 h-12 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : Object.keys(groupedProducts).length === 0 ? (
              <div className="text-center py-20 text-[#8B736D]">
                <p>Skincare "{searchQuery}" tidak ditemukan.</p>
              </div>
            ) : (
              <div className="space-y-12 md:space-y-16">
                {Object.entries(groupedProducts).map(([categoryName, items]: [string, any]) => (
                  <div key={categoryName}>
                    <div className="mb-6 border-b border-[#EAE3D9] pb-3 flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#660033]"></span>
                      <h2 className="text-xl md:text-2xl font-serif font-bold text-[#660033] uppercase tracking-wide">
                        {categoryName}
                      </h2>
                      <span className="text-xs md:text-sm text-[#8B736D] font-light ml-2">
                        ({items.length} Produk)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
                      {items.map((p: any, i: number) => {
                        const isHabis = p.is_available === false || p.is_available === 0 || String(p.is_available) === "0" || String(p.is_available).toLowerCase() === "false";
                        const claim = p.claim_category || p.ingredients_category;

                        return (
                          <div 
                            key={p.id || i} 
                            // Tambahkan class 'group' di sini untuk efek hover gambar
                            className={`group relative bg-white rounded-[20px] md:rounded-[30px] p-4 md:p-6 border border-[#EAE3D9] flex flex-col transition-all duration-300 ${
                              isHabis ? "opacity-60 grayscale-[40%]" : "hover:shadow-lg hover:-translate-y-1"
                            }`}
                          >
                            {isHabis && (
                              <div className="absolute top-3 right-3 md:top-5 md:right-5 z-10 bg-red-600/90 backdrop-blur-sm text-white text-[8px] md:text-[10px] font-bold px-2 py-1 md:px-3 md:py-1.5 rounded-full shadow-md tracking-wider">
                                HABIS
                              </div>
                            )}

                            {/* --- TAMBAHAN FOTO SKINCARE DI SINI --- */}
                            <div className="w-full h-32 md:h-44 bg-gray-50/50 rounded-xl mb-4 md:mb-5 p-3 flex items-center justify-center overflow-hidden border border-[#EAE3D9]/50">
                              <img 
                                src={p.image_url || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400"} 
                                alt={p.product_name} 
                                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110"
                              />
                            </div>

                            <div className="mb-3 md:mb-4">
                              <span className="inline-block px-2 py-1 md:px-3 bg-[#F8F3ED] text-[#660033] text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 md:mb-3">
                                {p.product_type || "Skincare"}
                              </span>
                              <h3 className="text-sm md:text-lg font-bold text-[#3A2E2B] leading-tight mb-1 pr-6 md:pr-10 line-clamp-2">
                                {p.product_name}
                              </h3>
                              <p className="text-[10px] md:text-xs text-[#A58D87] font-semibold line-clamp-1">{p.brand}</p>
                            </div>
                            
                            <div className="mt-auto pt-3 md:pt-4 border-t border-[#EAE3D9]/50">
                              <p className="text-[10px] md:text-xs text-[#8B736D] line-clamp-1 md:line-clamp-2 mb-3 md:mb-4" title={p.ingredients_list}>
                                <span className="font-bold">Bahan:</span> {p.ingredients_list}
                              </p>
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-0 mb-2 md:mb-4">
                                <span className="text-[#660033] font-bold text-sm md:text-lg">
                                  {formatRupiah(p.price)}
                                </span>
                                {claim && claim !== 'General' && (
                                  <span className="text-[8px] md:text-[10px] bg-[#660033] text-white px-2 py-1 rounded-md shadow-sm line-clamp-1">
                                    {claim.split(',')[0]}
                                  </span>
                                )}
                              </div>
                              {isHabis && (
                                <div className="w-full mt-2 md:mt-4 py-1.5 md:py-2 text-center text-[9px] md:text-[11px] font-bold tracking-widest text-red-500 bg-red-50 rounded-lg border border-red-100">
                                  OUT OF STOCK
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}