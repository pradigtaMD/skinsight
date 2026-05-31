"use client";
import { useState, useEffect } from 'react';

export default function EdukasiPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [edukasiData, setEdukasiData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);

  const filters = ['All', 'Skincare 101', 'Myths vs Facts', 'Tutorials'];

  // ==========================================
  // VARIABEL API UTAMA (VERCEL DYNAMIC URL)
  // ==========================================
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchEdukasi = async () => {
      try {
        // Menggunakan API_URL dan menambahkan endpoint /api/educations
        const response = await fetch(`${API_URL}/api/educations`);
        const result = await response.json();
        if (result.status === "success") {
          setEdukasiData(result.data);
        }
      } catch (error) {
        console.error("Gagal memuat data edukasi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEdukasi();
  }, []);

  const filteredData = activeFilter === 'All' 
    ? edukasiData 
    : edukasiData.filter(item => item.category === activeFilter);

  const isYouTubeStandard = (url: string) => (url?.includes("youtube.com/watch") || url?.includes("youtu.be/")) && !url?.includes("shorts");
  const isYouTubeShort = (url: string) => url?.includes("youtube.com/shorts/");
  const isPlayable = (url: string) => isYouTubeStandard(url) || isYouTubeShort(url);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("shorts/")) videoId = url.split("shorts/")[1].split("?")[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] -mt-16 md:-mt-20 pt-24 md:pt-32 pb-20 px-3 md:px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION DENGAN GHOST TEXT */}
        <header className="mb-12 md:mb-20 text-center md:text-left flex flex-col md:flex-row justify-between items-center md:items-end gap-10 relative">
          
          <div className="max-w-xl relative">
            {/* TULISAN BERBAYANG (GHOST TEXT) */}
            <span className="absolute -top-6 md:-top-16 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 text-[12vw] sm:text-7xl md:text-9xl font-black text-[#660033]/5 uppercase tracking-[0.1em] md:tracking-[0.15em] pointer-events-none select-none z-0 whitespace-nowrap">
              KNOWLEDGE
            </span>
            
            <div className="relative z-10">
              <p className="text-[#660033] font-serif italic text-sm md:text-xl mb-2 opacity-90">
                "Glow begins with understanding."
              </p>
              <h1 className="text-4xl md:text-6xl text-[#660033] font-serif leading-tight">
                Skin <span className="italic text-[#3A2E2B]">Education</span>
              </h1>
            </div>
          </div>
          
          {/* CATEGORY FILTERS (GAYA LAMA) */}
          <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 relative z-10">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 md:px-7 py-2.5 rounded-full text-[10px] md:text-xs font-bold transition-all border-2 ${
                  activeFilter === filter 
                  ? 'bg-[#660033] text-white border-[#660033] shadow-lg shadow-[#660033]/20' 
                  : 'bg-white text-[#8B736D] border-[#EAE3D9] hover:border-[#660033]'
                }`}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#660033] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredData.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                {/* VIDEO CARD */}
                {item.type === 'video' && (
                  <div onClick={() => isPlayable(item.content) ? setSelectedVideo(item.content) : window.open(item.content, '_blank')} className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-500">
                    <div className={`${isYouTubeShort(item.content) ? 'aspect-[9/16]' : 'aspect-video'} w-full bg-[#EAE3D9]`}>
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute top-2 right-2 w-7 h-7 bg-[#660033] rounded-full flex items-center justify-center border border-white/30 text-white shadow-lg">
                        <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3"><h3 className="text-[10px] md:text-sm font-serif text-white font-bold leading-tight line-clamp-2">{item.title}</h3></div>
                  </div>
                )}

                {/* ARTICLE CARD */}
                {item.type === 'article' && (
                  <div onClick={() => window.open(item.content, '_blank')} className="bg-white rounded-2xl overflow-hidden shadow-md border border-[#EAE3D9] group cursor-pointer hover:border-[#660033]/20 transition-all duration-500">
                    <div className="aspect-video w-full overflow-hidden bg-[#F8F3ED]"><img src={item.image} alt={item.title} className="w-full h-full object-cover" /></div>
                    <div className="p-3">
                      <span className="text-[#660033] text-[7px] md:text-[9px] font-black uppercase tracking-widest block mb-1">{item.category}</span>
                      <h3 className="text-[10px] md:text-sm font-bold text-[#3A2E2B] group-hover:text-[#660033] leading-tight line-clamp-2">{item.title}</h3>
                    </div>
                  </div>
                )}

                {/* QUOTE CARD (Square) */}
                {item.type === 'quote' && (
                  <div onClick={() => setSelectedQuote(item)} className="bg-[#660033] text-[#FDFBF7] p-5 rounded-2xl shadow-lg relative overflow-hidden group cursor-pointer aspect-square flex flex-col justify-center hover:scale-[1.02] transition-transform">
                    <div className="absolute -right-1 -top-1 text-6xl text-white/10 font-serif font-black">"</div>
                    <span className="text-[7px] font-bold px-2 py-0.5 border border-white/30 rounded-full uppercase tracking-widest mb-2 inline-block self-start">{item.category}</span>
                    <h3 className="text-[11px] md:text-base font-bold font-serif leading-tight italic text-[#EAE3D9] line-clamp-4">{item.title}</h3>
                    <p className="mt-3 text-[8px] font-bold tracking-[0.2em] text-[#EAE3D9] opacity-60">LEARN MORE →</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL VIDEO */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#3A2E2B]/90 backdrop-blur-md" onClick={() => setSelectedVideo(null)}></div>
          <div className={`relative w-full ${isYouTubeShort(selectedVideo) ? 'max-w-[320px] aspect-[9/16]' : 'max-w-4xl aspect-video'} bg-black rounded-[2rem] overflow-hidden shadow-2xl z-10 border-4 border-white/10 animate-scaleIn`}>
            <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xl z-20">✕</button>
            <iframe src={getEmbedUrl(selectedVideo)} className="w-full h-full border-0" allowFullScreen></iframe>
          </div>
        </div>
      )}

      {/* MODAL QUOTE */}
      {selectedQuote && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-[#3A2E2B]/95 backdrop-blur-lg" onClick={() => setSelectedQuote(null)}></div>
          <div className="relative w-full max-w-xl bg-[#660033] rounded-[2.5rem] shadow-2xl border border-white/10 animate-scaleIn flex flex-col max-h-[85vh] overflow-hidden">
            <button onClick={(e) => { e.stopPropagation(); setSelectedQuote(null); }} className="absolute top-5 right-5 text-white/50 hover:text-white transition-all z-[60] p-2 bg-white/10 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
            <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar pt-16">
                <span className="text-[#EAE3D9] text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block opacity-60">{selectedQuote.category}</span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-6 italic border-l-4 border-[#EAE3D9] pl-6">{selectedQuote.title}</h2>
                <div className="text-white/90 text-sm md:text-base leading-relaxed font-light prose-invert" dangerouslySetInnerHTML={{ __html: selectedQuote.content }}></div>
                <div className="mt-10 pt-6 border-t border-white/10 flex justify-end"><button onClick={() => setSelectedQuote(null)} className="px-6 py-2 bg-white text-[#660033] rounded-full font-bold text-[10px] uppercase tracking-widest">Selesai</button></div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
      `}} />
    </main>
  );
}