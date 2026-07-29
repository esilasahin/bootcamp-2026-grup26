import { useState, useRef } from "react";

export default function CareerAgent() {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosyaYuklendi, setDosyaYuklendi] = useState(false);
  const [secilenDosyaAdi, setSecilenDosyaAdi] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [analizSonucu, setAnalizSonucu] = useState(null);

  const dosyaGirdisiRef = useRef(null);

  const dosyaSeciciyiAc = () => {
    dosyaGirdisiRef.current.click();
  };

  const dosyaSecildi = async (event) => {
    setHataMesaji("");
    const dosya = event.target.files[0];

    if (dosya) {
      if (!dosya.name.match(/\.(pdf|doc|docx)$/i)) {
        setHataMesaji("Desteklenmeyen format! Lütfen CV'nizi PDF veya DOCX formatında yükleyin.");
        return;
      }
      if (dosya.size > 5242880) {
        setHataMesaji("Dosya çok büyük! Lütfen 5MB'den küçük bir özgeçmiş seçin.");
        return;
      }

      setSecilenDosyaAdi(dosya.name);
      setYukleniyor(true);

      try {
        // Yapay zeka servisinin yanıt süresini simüle ediyoruz (3 saniye)
        await new Promise(resolve => setTimeout(resolve, 3000));

        setYukleniyor(false);
        setDosyaYuklendi(true);

        // Sistemin parse edeceği JSON formatında örnek bir AI Analiz Çıktısı
        setAnalizSonucu({
          score: 88,
          education: ["Kütahya Dumlupınar Üniversitesi - Elektronik Ticaret ve Yönetimi Yüksek Lisans"],
          experience: ["Özel Zonguldak Bahçeşehir Koleji - Robotik Kodlama Eğitmeni", "FPV Akademi - Eğitmen / Donanım Uzmanı"],
          technical_skills: ["React", "Vite", "FastAPI", "Python", "3D CAD / Tersine Mühendislik", "Robotik Kodlama"],
          soft_skills: ["Proje Yönetimi", "Takım Danışmanlığı (Çınar Kuvvetli mentorluğu)"],
          missing_areas: ["Uluslararası bulut sertifikasyon eksiği (örn. AWS/Azure)", "Akademik makale yayınlarının uluslararası endekslerde olmaması"],
          recommendations: ["Geliştirdiğin React ve FastAPI tabanlı çok ajanlı yapay zeka arayüz projelerini GitHub'da açık kaynak olarak yayınla.", "Eğitim teknolojileri (STEM ve Minecraft Education) üzerine yazdığın nitel araştırmaları sunmak için uluslararası sempozyumlara başvur."]
        });
      } catch (error) {
        setYukleniyor(false);
        setHataMesaji("Sistem Hatası: Kariyer yapay zeka servisine bağlanılamadı.");
      }
    }
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Kariyer Asistanı (Career Agent)</h1>
      <p className="page-subtitle">Özgeçmişini yükle, yapay zeka eksiklerini bulup sana özel bir kariyer yolu çizsin.</p>

      {hataMesaji !== "" && (
        <div className="error-alert fade-in">
          <span className="error-icon">⚠️</span>
          <div><strong>Hata:</strong> {hataMesaji}</div>
        </div>
      )}

      <div className="glass-card">
        
        {!dosyaYuklendi && !yukleniyor && (
          <div className="upload-zone" onClick={dosyaSeciciyiAc}>
            <input type="file" ref={dosyaGirdisiRef} onChange={dosyaSecildi} accept=".pdf, .doc, .docx" style={{ display: "none" }} />
            <div className="upload-icon">📄</div>
            <h4 className="upload-title">CV yüklemek için buraya tıkla veya sürükle</h4>
            <p className="upload-desc">Desteklenen Dosyalar: PDF, DOC, DOCX (Maks: 5MB)</p>
          </div>
        )}

        {yukleniyor && (
          <div className="loading-state fade-in">
            <div className="spinner"></div>
            <h4 className="loading-title">Yapay Zeka CV'ni Analiz Ediyor...</h4>
            <p className="loading-desc">Eğitim geçmişin, deneyimlerin ve becerilerin çıkarılıyor: <span className="highlight-text">{secilenDosyaAdi}</span></p>
          </div>
        )}

        {dosyaYuklendi && analizSonucu && (
          <div className="fade-in">
            <div className="success-alert">
              <div className="success-icon">✅</div>
              <div>
                <strong style={{ display: "block", marginBottom: "4px" }}>Harika! CV'n başarıyla analiz edildi.</strong>
                <span style={{ fontSize: "14px", opacity: 0.9 }}>İşlenen Dosya: {secilenDosyaAdi}</span>
              </div>
            </div>

            <div className="result-card">
              <div className="result-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><span className="result-header-icon" style={{ marginRight: '8px' }}>🎯</span> Kariyer Analiz Sonucu</div>
                <div style={{ background: '#3b82f6', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                  Puan: {analizSonucu.score}/100
                </div>
              </div>
              <div className="result-body">
                <h4 className="result-section-title">💻 Tespit Edilen Teknik Beceriler</h4>
                <p className="result-text">{analizSonucu.technical_skills.join(", ")}</p>

                <h4 className="result-section-title">🔍 Gelişime Açık Alanlar (Eksikler)</h4>
                <ul className="result-list">
                  {analizSonucu.missing_areas.map((area, index) => <li key={index}>{area}</li>)}
                </ul>

                <h4 className="result-section-title">💡 Yapay Zeka Önerileri</h4>
                <ul className="result-list">
                  {analizSonucu.recommendations.map((rec, index) => <li key={index}>{rec}</li>)}
                </ul>
              </div>
            </div>

            <button
              onClick={() => { setDosyaYuklendi(false); setSecilenDosyaAdi(""); setHataMesaji(""); setAnalizSonucu(null); }}
              className="btn-secondary"
            >
              Yeni CV Yükle
            </button>
          </div>
        )}

      </div>
    </div>
  );
}