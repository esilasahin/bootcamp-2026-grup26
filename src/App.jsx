import { useState, useRef } from "react";

export default function App() {
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosyaYuklendi, setDosyaYuklendi] = useState(false);
  const [secilenDosyaAdi, setSecilenDosyaAdi] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [sonOzet, setSonOzet] = useState(null);
  
  const dosyaGirdisiRef = useRef(null);

  const dosyaSeciciyiAc = () => {
    dosyaGirdisiRef.current.click();
  };

  const dosyaSecildi = async (event) => {
    setHataMesaji(""); 
    const dosya = event.target.files[0];
    
    if (dosya) {
      if (!dosya.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
        setHataMesaji("Desteklenmeyen format! Lütfen sadece PDF, JPG veya PNG yükleyin.");
        return; 
      }
      if (dosya.size > 5242880) {
        setHataMesaji("Dosya çok büyük! Lütfen 5MB'den küçük bir belge seçin.");
        return;
      }
      
      setSecilenDosyaAdi(dosya.name);
      setYukleniyor(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        setYukleniyor(false);
        setDosyaYuklendi(true);
        
        setSonOzet({
          baslik: "Yapay Zekaya Giriş Dersi",
          dosya: dosya.name,
          tarih: new Date().toLocaleDateString('tr-TR')
        });

      } catch (error) {
        setYukleniyor(false);
        setHataMesaji("Sistem Hatası: Yapay zeka servisine (LLM) bağlanılamadı. Lütfen daha sonra tekrar deneyin.");
      }
    }
  };

  return (
    <div className="app-container">
      
      {/* 1. SOL MENÜ (SIDEBAR) */}
      <div className="sidebar">
        <div>
          <div className="logo-container">
            <div className="logo-icon">✨</div>
            <h2 className="logo-text">UniMate AI</h2>
          </div>
          
          <nav className="nav-menu">
            <button 
              onClick={() => { setAktifSayfa("dashboard"); setHataMesaji(""); }}
              className={`nav-btn ${aktifSayfa === "dashboard" ? "active" : ""}`}
            >
              <span className="nav-icon">📊</span> Dashboard
            </button>

            <button 
              onClick={() => { setAktifSayfa("study-agent"); setHataMesaji(""); }}
              className={`nav-btn ${aktifSayfa === "study-agent" ? "active" : ""}`}
            >
              <span className="nav-icon">🧠</span> Study Agent
            </button>

            <button disabled className="nav-btn disabled">
              <span className="nav-icon">💼</span> Career Agent <span className="badge">Yakında</span>
            </button>
          </nav>
        </div>
        
        <div className="sidebar-footer">
          <div className="team-badge">MindForce - Grup 26</div>
        </div>
      </div>

      {/* 2. SAĞ TARAF */}
      <div className="main-content">
        
        <div className="navbar">
          <div className="breadcrumb">
            <span style={{ color: "#94a3b8" }}>Panel</span> 
            <span style={{ margin: "0 10px", color: "#cbd5e1" }}>/</span> 
            <span style={{ color: "#1e293b", fontWeight: "600" }}>
              {aktifSayfa === "dashboard" ? "Genel Bakış" : "Ders Çalışma Alanı"}
            </span>
          </div>
          
          <div className="user-profile">
            <div className="avatar">ŞK</div>
            <span className="user-name">Şifanur Karakılçık</span>
          </div>
        </div>

        <div className="page-content">
          
          {aktifSayfa === "dashboard" && (
            <div className="fade-in">
              <h1 className="page-title">Genel Bakış</h1>
              <p className="page-subtitle">Akademik sürecini ve yapay zeka analizlerini buradan yönet.</p>

              {!sonOzet ? (
                <div className="glass-card text-center">
                  <div className="empty-state-icon">📁</div>
                  <h3 className="empty-state-title">Henüz analiz edilmiş bir belgeniz yok</h3>
                  <p className="empty-state-desc">
                    Sisteme PDF veya görsel biçiminde ders notu yükleyerek yapay zekanın senin için özet çıkarmasını sağlayabilirsin.
                  </p>
                  <button onClick={() => setAktifSayfa("study-agent")} className="btn-primary">
                    ✨ İlk Belgeni Yükle
                  </button>
                </div>
              ) : (
                <div className="dashboard-grid">
                  <div className="glass-card">
                    <h3 className="section-title" style={{ marginTop: 0, display: "flex", justifyContent: "space-between" }}>
                      <span>🕒 Son Oluşturulan Özet</span>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>{sonOzet.tarih}</span>
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "20px" }}>
                      <div style={{ fontSize: "32px" }}>📄</div>
                      <div>
                        <h4 style={{ margin: "0 0 5px 0", color: "#1e293b" }}>{sonOzet.baslik}</h4>
                        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Kaynak: {sonOzet.dosya}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setAktifSayfa("study-agent")} 
                      className="btn-secondary" style={{ width: "100%", marginTop: "20px" }}
                    >
                      Yeni Belge Analiz Et
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {aktifSayfa === "study-agent" && (
            <div className="fade-in">
              <h1 className="page-title">Study Agent</h1>
              <p className="page-subtitle">Ders notunu veya slayt görselini yükleyerek yapay zekanın gücünü kullan.</p>

              {hataMesaji !== "" && (
                <div className="error-alert fade-in">
                  <span className="error-icon">⚠️</span> 
                  <div><strong>Hata:</strong> {hataMesaji}</div>
                </div>
              )}

              <div className="glass-card">
                
                {!dosyaYuklendi && !yukleniyor && (
                  <div className="upload-zone" onClick={dosyaSeciciyiAc}>
                    <input type="file" ref={dosyaGirdisiRef} onChange={dosyaSecildi} accept=".pdf, .jpg, .jpeg, .png" style={{ display: "none" }} />
                    <div className="upload-icon">☁️</div>
                    <h4 className="upload-title">Dosya yüklemek için buraya tıkla veya sürükle</h4>
                    <p className="upload-desc">Desteklenen Dosyalar: PDF, JPG, PNG (Maks: 5MB)</p>
                  </div>
                )}

                {yukleniyor && (
                  <div className="loading-state fade-in">
                    <div className="spinner"></div>
                    <h4 className="loading-title">Yapay Zeka Özeti Hazırlanıyor...</h4>
                    <p className="loading-desc">İşlenen Dosya: <span className="highlight-text">{secilenDosyaAdi}</span></p>
                  </div>
                )}

                {dosyaYuklendi && (
                  <div className="fade-in">
                    <div className="success-alert">
                      <div className="success-icon">✅</div> 
                      <div>
                        <strong style={{ display: "block", marginBottom: "4px" }}>Harika! Belgeniz başarıyla işlendi.</strong>
                        <span style={{ fontSize: "14px", opacity: 0.9 }}>Dosya: {secilenDosyaAdi}</span>
                      </div>
                    </div>

                    <div className="result-card">
                      <div className="result-header">
                        <span className="result-header-icon">📖</span> 
                        Yapay Zeka Özeti: Yapay Zekaya Giriş Dersi
                      </div>
                      <div className="result-body">
                        <h4 className="result-section-title">Ana Temalar</h4>
                        <p className="result-text">
                          Yapay zeka sistemleri temel olarak veriden öğrenen algoritmalara dayanır. Makine öğrenmesi ve derin öğrenme bu sistemlerin alt dallarıdır.
                        </p>
                        <h4 className="result-section-title">Önemli Noktalar</h4>
                        <ul className="result-list">
                          <li><strong>Veri Seti:</strong> Modelin başarısı %80 oranında verinin kalitesine bağlıdır.</li>
                          <li><strong>Öğrenme Türleri:</strong> Gözetimli ve Gözetimsiz öğrenme yöntemleri vardır.</li>
                        </ul>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setDosyaYuklendi(false); setSecilenDosyaAdi(""); setHataMesaji(""); }}
                      className="btn-secondary"
                    >
                      Yeni Dosya Yükle
                    </button>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        .app-container {
          display: flex; height: 100vh; font-family: 'Inter', sans-serif;
          background-color: #f8fafc; margin: 0; color: #0f172a;
        }

        .sidebar {
          width: 280px; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: white; padding: 24px; display: flex; flex-direction: column; justify-content: space-between;
          box-shadow: 4px 0 24px rgba(0,0,0,0.05); z-index: 10;
        }
        
        .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; padding: 0 10px; }
        .logo-icon { font-size: 24px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .logo-text { font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
        
        .nav-menu { display: flex; flex-direction: column; gap: 8px; }
        .nav-btn {
          display: flex; align-items: center; gap: 12px; text-align: left; padding: 14px 16px;
          border-radius: 12px; border: none; cursor: pointer; font-size: 15px; font-weight: 500;
          background: transparent; color: #94a3b8; transition: all 0.3s ease;
        }
        .nav-btn:hover:not(.disabled) { background: rgba(255,255,255,0.05); color: white; transform: translateX(4px); }
        .nav-btn.active { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
        .nav-btn.disabled { opacity: 0.5; cursor: not-allowed; }
        .badge { background: rgba(255,255,255,0.1); font-size: 11px; padding: 4px 8px; border-radius: 20px; margin-left: auto; }
        
        .team-badge { background: rgba(0,0,0,0.2); text-align: center; padding: 12px; border-radius: 10px; font-size: 12px; color: #64748b; font-weight: 500; border: 1px solid rgba(255,255,255,0.05); }

        .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f8fafc; }
        .navbar { height: 72px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: space-between; padding: 0 40px; border-bottom: 1px solid rgba(226, 232, 240, 0.8); position: sticky; top: 0; z-index: 5; }
        
        .user-profile { display: flex; align-items: center; gap: 12px; padding: 6px 12px; background: white; border-radius: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; cursor: pointer; transition: all 0.2s; }
        .user-profile:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; }
        .user-name { font-weight: 600; color: #334155; font-size: 14px; padding-right: 8px; }

        .page-content { padding: 40px 50px; max-width: 1200px; margin: 0 auto; width: 100%; }
        .page-title { font-size: 32px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a; letter-spacing: -0.5px; }
        .page-subtitle { color: #64748b; margin: 0 0 40px 0; font-size: 16px; }

        .glass-card { background: white; padding: 40px; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 40px rgba(0,0,0,0.03); transition: transform 0.3s ease; }
        .glass-card:hover { box-shadow: 0 15px 50px rgba(0,0,0,0.05); }
        .text-center { text-align: center; }
        
        .empty-state-icon { font-size: 64px; margin-bottom: 20px; animation: float 3s ease-in-out infinite; }
        .empty-state-title { font-size: 22px; margin: 0 0 12px 0; color: #1e293b; }
        .empty-state-desc { color: #64748b; max-width: 480px; margin: 0 auto 30px auto; line-height: 1.6; }
        
        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }

        .btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 28px; border: none; border-radius: 12px; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); transition: all 0.3s ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4); }
        
        .btn-secondary { background: white; color: #ef4444; padding: 12px 24px; border: 1px solid #fca5a5; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-secondary:hover { background: #fef2f2; }

        .upload-zone { border: 2px dashed #cbd5e1; border-radius: 20px; padding: 60px 40px; text-align: center; cursor: pointer; background: #f8fafc; transition: all 0.3s ease; }
        .upload-zone:hover { border-color: #3b82f6; background: #eff6ff; transform: scale(1.01); }
        .upload-icon { font-size: 48px; margin-bottom: 16px; }
        .upload-title { margin: 0 0 8px 0; color: #334155; font-size: 18px; }
        .upload-desc { color: #64748b; margin: 0; font-size: 14px; }

        .error-alert { background: #fef2f2; color: #991b1b; padding: 16px 20px; border-radius: 12px; border: 1px solid #fecaca; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
        .success-alert { background: linear-gradient(to right, #ecfdf5, #d1fae5); color: #065f46; padding: 20px; border-radius: 16px; margin-bottom: 30px; display: flex; align-items: center; gap: 16px; border: 1px solid #a7f3d0; }
        .success-icon { font-size: 24px; background: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

        .result-card { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: white; margin-bottom: 24px; }
        .result-header { background: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 10px; }
        .result-body { padding: 24px; }
        .result-section-title { color: #334155; font-size: 16px; margin: 0 0 12px 0; }
        .result-text, .result-list { color: #475569; line-height: 1.7; font-size: 15px; margin-bottom: 24px; }

        .spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        .loading-state { text-align: center; padding: 60px 20px; }
        .loading-title { margin: 24px 0 8px 0; color: #1e293b; font-size: 18px; }
        .highlight-text { color: #3b82f6; font-weight: 600; }
        
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}