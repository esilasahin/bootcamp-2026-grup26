import { useState, useRef } from "react";
import { analyzeCV } from "./services/careerAgent";
import { validateFile } from "./services/api";
import { LoadingState, ErrorState } from "./components/StateComponents";

export default function CareerAgent({ onAnalysisComplete }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosyaYuklendi, setDosyaYuklendi] = useState(false);
  const [secilenDosyaAdi, setSecilenDosyaAdi] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");
  const [analizSonucu, setAnalizSonucu] = useState(null);
  const [suruklemeAktif, setSuruklemeAktif] = useState(false);

  const dosyaGirdisiRef = useRef(null);
  const dosyaSeciciyiAc = () => dosyaGirdisiRef.current.click();

  const dosyayiIsle = async (dosya) => {
    setHataMesaji("");
    if (!dosya) return;

    const hata = validateFile(dosya, { allowed: ["pdf", "doc", "docx"], maxMB: 5 });
    if (hata) {
      setHataMesaji(hata);
      return;
    }

    setSecilenDosyaAdi(dosya.name);
    setYukleniyor(true);
    try {
      const sonuc = await analyzeCV(dosya);
      setAnalizSonucu(sonuc);
      setDosyaYuklendi(true);
      onAnalysisComplete?.({ ...sonuc, dosya: dosya.name, tarih: new Date().toLocaleDateString("tr-TR") });
    } catch (error) {
      setHataMesaji(error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const dosyaSecildi = (event) => dosyayiIsle(event.target.files[0]);

  const surukleBirak = (event) => {
    event.preventDefault();
    setSuruklemeAktif(false);
    dosyayiIsle(event.dataTransfer.files[0]);
  };

  const sifirla = () => {
    setDosyaYuklendi(false);
    setSecilenDosyaAdi("");
    setHataMesaji("");
    setAnalizSonucu(null);
  };

  return (
    <div className="fade-in">
      <h1 className="page-title">Kariyer Asistanı</h1>
      <p className="page-subtitle">
        Özgeçmişini yükle, yapay zeka eksiklerini bulup sana özel bir kariyer yolu çizsin.
      </p>

      <ErrorState message={hataMesaji} />

      <div className="glass-card">
        {!dosyaYuklendi && !yukleniyor && (
          <div
            className={`upload-zone ${suruklemeAktif ? "dragging" : ""}`}
            onClick={dosyaSeciciyiAc}
            onDragOver={(e) => { e.preventDefault(); setSuruklemeAktif(true); }}
            onDragLeave={() => setSuruklemeAktif(false)}
            onDrop={surukleBirak}
          >
            <input
              type="file"
              ref={dosyaGirdisiRef}
              onChange={dosyaSecildi}
              accept=".pdf, .doc, .docx"
              style={{ display: "none" }}
            />
            <h4 className="upload-title">CV yüklemek için buraya tıkla veya sürükle</h4>
            <p className="upload-desc">Desteklenen Dosyalar: PDF, DOC, DOCX (Maks: 5MB)</p>
          </div>
        )}

        {yukleniyor && (
          <LoadingState
            title="Yapay Zeka CV'ni Analiz Ediyor..."
            desc="Eğitim geçmişin, deneyimlerin ve becerilerin çıkarılıyor:"
            dosyaAdi={secilenDosyaAdi}
          />
        )}

        {dosyaYuklendi && analizSonucu && (
          <div className="fade-in">
            <div className="success-alert">
              <div>
                <strong style={{ display: "block", marginBottom: "4px" }}>
                  CV'n başarıyla analiz edildi.
                </strong>
                <span style={{ fontSize: "14px", opacity: 0.9 }}>İşlenen Dosya: {secilenDosyaAdi}</span>
              </div>
            </div>

            <div className="result-card">
              <div
                className="result-header"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>Kariyer Analiz Sonucu</div>
                <div className="score-badge">Puan: {analizSonucu.score}/100</div>
              </div>

              <div className="result-body">
                {analizSonucu.education?.length > 0 && (
                  <>
                    <h4 className="result-section-title">Eğitim</h4>
                    <ul className="result-list">
                      {analizSonucu.education.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </>
                )}

                {analizSonucu.experience?.length > 0 && (
                  <>
                    <h4 className="result-section-title">Deneyim</h4>
                    <ul className="result-list">
                      {analizSonucu.experience.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </>
                )}

                <h4 className="result-section-title">Teknik Beceriler</h4>
                <div className="skill-chips">
                  {analizSonucu.technical_skills?.map((s, i) => (
                    <span key={i} className="skill-chip">{s}</span>
                  ))}
                </div>

                {analizSonucu.soft_skills?.length > 0 && (
                  <>
                    <h4 className="result-section-title" style={{ marginTop: "24px" }}>Sosyal Beceriler</h4>
                    <div className="skill-chips">
                      {analizSonucu.soft_skills.map((s, i) => (
                        <span key={i} className="skill-chip soft">{s}</span>
                      ))}
                    </div>
                  </>
                )}

                <h4 className="result-section-title" style={{ marginTop: "24px" }}>Gelişime Açık Alanlar</h4>
                <ul className="result-list">
                  {analizSonucu.missing_areas?.map((area, i) => <li key={i}>{area}</li>)}
                </ul>

                <h4 className="result-section-title">Yapay Zeka Önerileri</h4>
                <ul className="result-list">
                  {analizSonucu.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>
            </div>

            <button onClick={sifirla} className="btn-secondary">Yeni CV Yükle</button>
          </div>
        )}
      </div>
    </div>
  );
}
