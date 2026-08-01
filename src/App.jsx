import CareerAgent from "./CareerAgent";
import QuizAgent from "./QuizAgent";
import CoachCard from "./CoachCard";
import NavIcon, { GradCap } from "./NavIcons";
import { LoadingState, ErrorState, EmptyState } from "./components/StateComponents";
import { getCoachRecommendation } from "./services/coachAgent";
import { summarizeStudyMaterial } from "./services/studyAgent";
import { validateFile } from "./services/api";
import { useState, useRef, useEffect, useCallback } from "react";

export default function App() {
  const [aktifSayfa, setAktifSayfa] = useState("dashboard");
  const [sidebarAcik, setSidebarAcik] = useState(false);
  const [menuKapali, setMenuKapali] = useState(false);

  const [yukleniyor, setYukleniyor] = useState(false);
  const [dosyaYuklendi, setDosyaYuklendi] = useState(false);
  const [secilenDosyaAdi, setSecilenDosyaAdi] = useState("");
  const [hataMesaji, setHataMesaji] = useState("");

  const [studyOzeti, setStudyOzeti] = useState(null);
  const [careerSonucu, setCareerSonucu] = useState(null);
  const [quizSonucu, setQuizSonucu] = useState(null);
  const [sonDosyalar, setSonDosyalar] = useState([]);

  const [coachOnerisi, setCoachOnerisi] = useState(null);
  const [coachYukleniyor, setCoachYukleniyor] = useState(false);
  const [coachSurum, setCoachSurum] = useState(0);

  const dosyaGirdisiRef = useRef(null);

  const sayfaDegistir = (sayfa) => {
    setAktifSayfa(sayfa);
    setHataMesaji("");
    setSidebarAcik(false);
  };

  const dosyaEkle = (ad, tip) =>
    setSonDosyalar((prev) => [{ ad, tip, tarih: new Date().toLocaleDateString("tr-TR") }, ...prev].slice(0, 5));

  const coachGetir = useCallback(async () => {
    setCoachYukleniyor(true);
    try {
      const oneri = await getCoachRecommendation({ studyResult: studyOzeti, careerResult: careerSonucu });
      setCoachOnerisi(oneri);
      setCoachSurum((v) => v + 1);
    } catch {
      setCoachOnerisi((mevcut) => mevcut);
    } finally {
      setCoachYukleniyor(false);
    }
  }, [studyOzeti, careerSonucu]);

  useEffect(() => {
    let active = true;
    getCoachRecommendation({})
      .then((oneri) => { if (active) { setCoachOnerisi(oneri); setCoachSurum((v) => v + 1); } })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const dosyaSeciciyiAc = () => dosyaGirdisiRef.current.click();

  const dosyaSecildi = async (event) => {
    setHataMesaji("");
    const dosya = event.target.files[0];
    if (!dosya) return;

    const hata = validateFile(dosya, { allowed: ["pdf", "jpg", "jpeg", "png"], maxMB: 5 });
    if (hata) {
      setHataMesaji(hata);
      return;
    }

    setSecilenDosyaAdi(dosya.name);
    setYukleniyor(true);
    try {
      const ozet = await summarizeStudyMaterial(dosya);
      setStudyOzeti({ ...ozet, dosya: dosya.name, tarih: new Date().toLocaleDateString("tr-TR") });
      setDosyaYuklendi(true);
      dosyaEkle(dosya.name, "ders");
    } catch (error) {
      setHataMesaji(error.message);
    } finally {
      setYukleniyor(false);
    }
  };

  const careerTamamlandi = (sonuc) => {
    setCareerSonucu(sonuc);
    dosyaEkle(sonuc.dosya, "cv");
    coachGetir();
  };

  const NAV = [
    { key: "dashboard", label: "Dashboard", kisa: "Da" },
    { key: "study-agent", label: "Study", kisa: "St" },
    { key: "quiz", label: "Quiz", kisa: "Qz" },
    { key: "career-agent", label: "Career", kisa: "Ca" },
    { key: "coach", label: "Coach", kisa: "Co" },
  ];

  const baslikMap = {
    dashboard: "Genel Bakış",
    "study-agent": "Ders Çalışma Alanı",
    quiz: "Quiz",
    "career-agent": "Kariyer Asistanı",
    coach: "Kariyer & Akademik Koç",
  };

  const quizKonulari = [
    ...(studyOzeti ? [studyOzeti.baslik] : []),
    ...sonDosyalar.filter((d) => d.tip === "ders").map((d) => d.ad),
  ].filter((konu, i, arr) => arr.indexOf(konu) === i);

  return (
    <div className="app-container">
      {sidebarAcik && <div className="sidebar-overlay" onClick={() => setSidebarAcik(false)} />}

      <div className={`sidebar ${sidebarAcik ? "open" : ""} ${menuKapali ? "kapali" : ""}`}>
        <div>
          <div className={`sidebar-head ${menuKapali ? "kapali" : ""}`}>
            <button
              className="collapse-btn"
              onClick={() => setMenuKapali((v) => !v)}
              aria-label={menuKapali ? "Menüyü genişlet" : "Menüyü daralt"}
            >
              {menuKapali ? ">" : "<"}
            </button>

            <div key={menuKapali ? "mate" : "unimate"} className={`logo-container ${menuKapali ? "kapali" : ""}`}>
              <div className="grad-cap">
                <GradCap />
              </div>
              <h2 className="logo-text">{menuKapali ? "Mate" : "UniMate AI"}</h2>
            </div>
          </div>

          <nav className="nav-menu">
            {NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => sayfaDegistir(item.key)}
                title={item.label}
                className={`nav-btn ${aktifSayfa === item.key ? "active" : ""}`}
              >
                <span className="nav-box">
                  <NavIcon name={item.key} />
                  {!menuKapali && <span className="nav-label">{item.label}</span>}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="team-badge">{menuKapali ? "G26" : "MindForce - Grup 26"}</div>
        </div>
      </div>

      <div className="main-content">
        <div className="navbar">
          <div className="breadcrumb">
            <button className="hamburger" onClick={() => setSidebarAcik(true)} aria-label="Menü">Menü</button>
            <span style={{ color: "#94a3b8" }}>Panel</span>
            <span style={{ margin: "0 10px", color: "#cbd5e1" }}>/</span>
            <span style={{ color: "#1e293b", fontWeight: "600" }}>{baslikMap[aktifSayfa]}</span>
          </div>

          <div className="user-profile">
            <div className="avatar">YK</div>
            <span className="user-name">Yüksel Karan</span>
          </div>
        </div>

        <div className="page-content">
          {aktifSayfa === "dashboard" && (
            <div className="fade-in">
              <h1 className="page-title">Genel Bakış</h1>
              <p className="page-subtitle">Akademik sürecini ve yapay zeka analizlerini buradan yönet.</p>

              <div style={{ marginBottom: "24px" }}>
                <CoachCard key={`dash-${coachSurum}`} coach={coachOnerisi} yukleniyor={coachYukleniyor} onYenile={coachGetir} />
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value">{studyOzeti ? "1" : "0"}</div>
                  <div className="stat-label">Analiz Edilen Ders</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{careerSonucu ? `${careerSonucu.score}` : "—"}</div>
                  <div className="stat-label">CV Puanı</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{quizSonucu ? `%${quizSonucu.score}` : "—"}</div>
                  <div className="stat-label">Son Quiz Başarısı</div>
                </div>
              </div>

              {!studyOzeti && !careerSonucu ? (
                <EmptyState
                  title="Henüz analiz edilmiş bir belgen yok"
                  desc="Sisteme ders notu veya CV yükleyerek yapay zekanın senin için analiz yapmasını sağlayabilirsin."
                  actionLabel="İlk Belgeni Yükle"
                  onAction={() => sayfaDegistir("study-agent")}
                />
              ) : (
                <div className="dashboard-grid">
                  {studyOzeti && (
                    <div className="glass-card">
                      <h3 className="section-title dash-card-head">
                        <span>Son Oluşturulan Özet</span>
                        <span className="dash-card-date">{studyOzeti.tarih}</span>
                      </h3>
                      <div className="dash-card-body">
                        <div>
                          <h4 style={{ margin: "0 0 5px 0", color: "#1e293b" }}>{studyOzeti.baslik}</h4>
                          <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Kaynak: {studyOzeti.dosya}</p>
                        </div>
                      </div>
                      <button onClick={() => sayfaDegistir("quiz")} className="btn-primary" style={{ width: "100%", marginTop: "20px" }}>
                        Bu Konudan Quiz Çöz
                      </button>
                    </div>
                  )}

                  {careerSonucu && (
                    <div className="glass-card">
                      <h3 className="section-title dash-card-head">
                        <span>Kariyer Analizi</span>
                        <span className="score-badge">{careerSonucu.score}/100</span>
                      </h3>
                      <div className="skill-chips" style={{ marginTop: "16px" }}>
                        {careerSonucu.technical_skills?.slice(0, 5).map((s, i) => (
                          <span key={i} className="skill-chip">{s}</span>
                        ))}
                      </div>
                      <button onClick={() => sayfaDegistir("career-agent")} className="btn-primary" style={{ width: "100%", marginTop: "20px" }}>
                        Detayları Gör
                      </button>
                    </div>
                  )}

                  {sonDosyalar.length > 0 && (
                    <div className="glass-card">
                      <h3 className="section-title dash-card-head"><span>Son Yüklenen Dosyalar</span></h3>
                      <ul className="recent-files">
                        {sonDosyalar.map((d, i) => (
                          <li key={i}>
                            <span className="recent-tag">{d.tip === "cv" ? "CV" : "Ders"}</span>
                            <span className="recent-name">{d.ad}</span>
                            <span className="recent-date">{d.tarih}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {aktifSayfa === "study-agent" && (
            <div className="fade-in">
              <h1 className="page-title">Study Agent</h1>
              <p className="page-subtitle">Ders notunu veya slayt görselini yükleyerek yapay zekanın gücünü kullan.</p>

              <ErrorState message={hataMesaji} />

              <div className="glass-card">
                {!dosyaYuklendi && !yukleniyor && (
                  <div className="upload-zone" onClick={dosyaSeciciyiAc}>
                    <input type="file" ref={dosyaGirdisiRef} onChange={dosyaSecildi} accept=".pdf, .jpg, .jpeg, .png" style={{ display: "none" }} />
                    <h4 className="upload-title">Dosya yüklemek için buraya tıkla veya sürükle</h4>
                    <p className="upload-desc">Desteklenen Dosyalar: PDF, JPG, PNG (Maks: 5MB)</p>
                  </div>
                )}

                {yukleniyor && (
                  <LoadingState title="Yapay Zeka Özeti Hazırlanıyor..." desc="İşlenen Dosya:" dosyaAdi={secilenDosyaAdi} />
                )}

                {dosyaYuklendi && studyOzeti && (
                  <div className="fade-in">
                    <div className="success-alert">
                      <div>
                        <strong style={{ display: "block", marginBottom: "4px" }}>Belgen başarıyla işlendi.</strong>
                        <span style={{ fontSize: "14px", opacity: 0.9 }}>Dosya: {studyOzeti.dosya}</span>
                      </div>
                    </div>

                    <div className="result-card">
                      <div className="result-header">Yapay Zeka Özeti: {studyOzeti.baslik}</div>
                      <div className="result-body">
                        {studyOzeti.anaTemalar && (
                          <>
                            <h4 className="result-section-title">Ana Temalar</h4>
                            <p className="result-text">{studyOzeti.anaTemalar}</p>
                          </>
                        )}
                        {studyOzeti.onemliNoktalar?.length > 0 && (
                          <>
                            <h4 className="result-section-title">Önemli Noktalar</h4>
                            <ul className="result-list">
                              {studyOzeti.onemliNoktalar.map((nokta, i) => <li key={i}>{nokta}</li>)}
                            </ul>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <button onClick={() => sayfaDegistir("quiz")} className="btn-primary">Bu Konudan Quiz Çöz</button>
                      <button onClick={() => { setDosyaYuklendi(false); setSecilenDosyaAdi(""); setHataMesaji(""); }} className="btn-secondary">
                        Yeni Dosya Yükle
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {aktifSayfa === "quiz" && (
            <QuizAgent studyResult={studyOzeti} konular={quizKonulari} onQuizComplete={setQuizSonucu} />
          )}

          {aktifSayfa === "career-agent" && <CareerAgent onAnalysisComplete={careerTamamlandi} />}

          {aktifSayfa === "coach" && (
            <div className="fade-in">
              <h1 className="page-title">Kariyer & Akademik Koç</h1>
              <p className="page-subtitle">
                Koç, Study ve Career sonuçlarını birleştirerek sana kişiselleştirilmiş haftalık öneriler sunar.
              </p>
              <CoachCard key={`coach-${coachSurum}`} coach={coachOnerisi} yukleniyor={coachYukleniyor} onYenile={coachGetir} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        .app-container { display: flex; height: 100vh; font-family: 'Poppins', sans-serif; background-color: #f8fafc; margin: 0; color: #0f172a; }

        .sidebar { width: 280px; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); color: white; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 4px 0 24px rgba(0,0,0,0.05); z-index: 30; transition: width 0.3s ease, transform 0.3s ease; overflow: hidden; }
        .sidebar.kapali { width: 104px; padding: 24px 14px; }
        .sidebar-overlay { display: none; }

        .sidebar-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 40px; min-height: 52px; }
        .sidebar-head.kapali { flex-direction: column; align-items: center; gap: 16px; }

        .collapse-btn { width: 40px; height: 40px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #cbd5e1; border-radius: 12px; font-size: 20px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; font-family: inherit; line-height: 1; order: 2; }
        .collapse-btn:hover { background: rgba(59,130,246,0.25); color: white; border-color: #3b82f6; }
        .sidebar-head.kapali .collapse-btn { order: 0; }

        .logo-container { display: flex; align-items: center; gap: 12px; padding: 0; order: 1; animation: logoUp 0.5s ease-out; }
        .logo-container.kapali { flex-direction: column; gap: 8px; order: 2; animation: logoDrop 0.5s ease-out; }
        .logo-text { font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.5px; white-space: nowrap; }
        .logo-container.kapali .logo-text { font-size: 17px; }

        .grad-cap { width: 52px; height: 42px; flex-shrink: 0; }
        .grad-cap-svg { width: 100%; height: 100%; transform-origin: center; animation: capFloat 3.2s ease-in-out infinite; }

        .nav-menu { display: flex; flex-direction: column; gap: 10px; }
        .nav-btn { display: flex; align-items: center; justify-content: flex-start; padding: 0; border-radius: 12px; border: none; cursor: pointer; background: transparent; transition: all 0.3s ease; font-family: inherit; }
        .nav-box { display: flex; align-items: center; justify-content: flex-start; gap: 12px; width: 100%; padding: 13px 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #cbd5e1; font-size: 15px; font-weight: 500; transition: all 0.25s ease; white-space: nowrap; }
        .nav-icon-svg { width: 22px; height: 22px; flex-shrink: 0; }
        .nav-label { white-space: nowrap; }
        .nav-btn:hover .nav-box { background: rgba(255,255,255,0.08); color: white; }
        .nav-btn.active .nav-box { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; font-weight: 600; border-color: transparent; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); }
        .sidebar.kapali .nav-box { justify-content: center; padding: 14px 0; gap: 0; }

        .team-badge { background: rgba(0,0,0,0.2); text-align: center; padding: 12px; border-radius: 10px; font-size: 12px; color: #64748b; font-weight: 500; border: 1px solid rgba(255,255,255,0.05); white-space: nowrap; }

        @keyframes logoUp { 0% { transform: translateY(14px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes logoDrop { 0% { transform: translateY(-14px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes capFloat { 0%, 100% { transform: translateY(0) rotate(-9deg); } 50% { transform: translateY(-5px) rotate(-1deg); } }

        .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f8fafc; }
        .navbar { height: 72px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: space-between; padding: 0 40px; border-bottom: 1px solid rgba(226, 232, 240, 0.8); position: sticky; top: 0; z-index: 20; }
        .breadcrumb { display: flex; align-items: center; }
        .hamburger { display: none; background: transparent; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; cursor: pointer; margin-right: 14px; color: #334155; padding: 6px 12px; border-radius: 8px; font-family: inherit; }

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
        .section-title { font-size: 18px; font-weight: 600; color: #1e293b; }

        .empty-state-title { font-size: 22px; margin: 0 0 12px 0; color: #1e293b; }
        .empty-state-desc { color: #64748b; max-width: 480px; margin: 0 auto 30px auto; line-height: 1.6; }

        .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .dash-card-head { margin-top: 0; display: flex; justify-content: space-between; align-items: center; }
        .dash-card-date { font-size: 12px; color: #64748b; font-weight: normal; }
        .dash-card-body { display: flex; align-items: center; gap: 15px; margin-top: 20px; }

        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 6px 20px rgba(0,0,0,0.02); }
        .stat-value { font-size: 30px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
        .stat-label { color: #64748b; font-size: 13px; }

        .recent-files { list-style: none; padding: 0; margin: 16px 0 0; display: flex; flex-direction: column; gap: 10px; }
        .recent-files li { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #f8fafc; border: 1px solid #eef2f7; border-radius: 12px; }
        .recent-tag { font-size: 11px; font-weight: 600; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px; }
        .recent-name { flex: 1; font-size: 14px; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .recent-date { font-size: 12px; color: #94a3b8; }

        .coach-card { background: linear-gradient(to right, #ffffff, #f8fafc); border-left: 4px solid #8b5cf6; }
        .coach-card-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
        .coach-refresh { background: white; border: 1px solid #ddd6fe; color: #7c3aed; padding: 8px 14px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: inherit; }
        .coach-refresh:hover { background: #f5f3ff; }
        .coach-message { color: #475569; font-size: 15px; font-style: italic; margin: 16px 0 0; }
        .coach-progress { margin-top: 20px; }
        .coach-progress-label { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 8px; }
        .coach-goal { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 12px; border: 1px solid; transition: background 0.3s, border-color 0.3s; }
        .coach-goal.academic { background: #eff6ff; border-color: #bfdbfe; }
        .coach-goal.career { background: #f0fdf4; border-color: #bbf7d0; }
        .coach-goal.tamam { background: #f0fdf4; border-color: #86efac; }
        .coach-goal.doldu { background: #fef2f2; border-color: #fecaca; }
        .coach-goal-body { flex: 1; min-width: 0; }
        .coach-goal-title { display: block; font-size: 14px; margin-bottom: 4px; }
        .coach-goal.academic .coach-goal-title { color: #1e40af; }
        .coach-goal.career .coach-goal-title { color: #166534; }
        .coach-goal-text { color: #334155; font-size: 15px; }
        .coach-goal-ok { display: block; margin-top: 6px; font-size: 12px; font-weight: 600; color: #15803d; }
        .coach-goal-uyari { display: block; margin-top: 6px; font-size: 12px; font-weight: 600; color: #b91c1c; }

        .coach-check { width: 26px; height: 26px; flex-shrink: 0; border-radius: 8px; border: 2px solid #cbd5e1; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: all 0.2s ease; }
        .coach-check:hover:not(:disabled) { border-color: #16a34a; background: #f0fdf4; }
        .coach-check:disabled { cursor: default; background: #16a34a; border-color: #16a34a; }
        .coach-check-mark { display: block; width: 6px; height: 11px; border: solid white; border-width: 0 2.5px 2.5px 0; transform: rotate(45deg) translateY(-1px); }

        .coach-ring { width: 40px; height: 40px; flex-shrink: 0; }
        .coach-ring-bg { fill: none; stroke: #e2e8f0; stroke-width: 3; }
        .coach-ring-fg { fill: none; stroke-width: 3; stroke-linecap: round; transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 0.95s linear, stroke 0.3s ease; }
        .coach-ring-check { fill: none; stroke: #16a34a; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

        .btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 28px; border: none; border-radius: 12px; font-weight: 600; font-size: 15px; cursor: pointer; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); transition: all 0.3s ease; font-family: inherit; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4); }
        .btn-primary:disabled { transform: none; cursor: not-allowed; box-shadow: none; }
        .btn-secondary { background: white; color: #ef4444; padding: 12px 24px; border: 1px solid #fca5a5; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
        .btn-secondary:hover { background: #fef2f2; }

        .upload-zone { border: 2px dashed #cbd5e1; border-radius: 20px; padding: 60px 40px; text-align: center; cursor: pointer; background: #f8fafc; transition: all 0.3s ease; }
        .upload-zone:hover, .upload-zone.dragging { border-color: #3b82f6; background: #eff6ff; transform: scale(1.01); }
        .upload-title { margin: 0 0 8px 0; color: #334155; font-size: 18px; }
        .upload-desc { color: #64748b; margin: 0; font-size: 14px; }

        .error-alert { background: #fef2f2; color: #991b1b; padding: 16px 20px; border-radius: 12px; border: 1px solid #fecaca; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
        .success-alert { background: linear-gradient(to right, #ecfdf5, #d1fae5); color: #065f46; padding: 20px; border-radius: 16px; margin-bottom: 30px; display: flex; align-items: center; gap: 16px; border: 1px solid #a7f3d0; }

        .result-card { border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: white; margin-bottom: 24px; }
        .result-header { background: #f8fafc; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 10px; }
        .result-body { padding: 24px; }
        .result-section-title { color: #334155; font-size: 16px; margin: 0 0 12px 0; }
        .result-text, .result-list { color: #475569; line-height: 1.7; font-size: 15px; margin-bottom: 24px; }
        .score-badge { background: #3b82f6; color: white; padding: 6px 14px; border-radius: 20px; font-size: 14px; font-weight: bold; }

        .skill-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
        .skill-chip { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .skill-chip.soft { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }

        .quiz-setup-label { font-size: 14px; font-weight: 600; color: #334155; margin: 24px 0 12px; }
        .quiz-topic-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .quiz-topic-chip { background: #f8fafc; border: 2px solid #e2e8f0; color: #334155; padding: 10px 16px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
        .quiz-topic-chip:hover { border-color: #93c5fd; }
        .quiz-topic-chip.selected { border-color: #3b82f6; background: #eff6ff; color: #1e40af; font-weight: 600; }
        .quiz-topic-input { width: 100%; padding: 14px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 15px; color: #1e293b; font-family: inherit; outline: none; transition: border-color 0.2s; }
        .quiz-topic-input:focus { border-color: #3b82f6; }
        .quiz-image-card { border: 2px dashed #cbd5e1; border-radius: 14px; padding: 24px; text-align: center; cursor: pointer; background: #f8fafc; transition: all 0.2s ease; }
        .quiz-image-card:hover { border-color: #3b82f6; background: #eff6ff; }
        .quiz-image-card.selected { border-style: solid; border-color: #3b82f6; background: #eff6ff; }
        .quiz-image-hint { color: #64748b; font-size: 14px; }
        .quiz-image-name { color: #1e40af; font-size: 14px; font-weight: 600; }
        .quiz-count-list { display: flex; gap: 10px; flex-wrap: wrap; }
        .quiz-count-chip { background: #f8fafc; border: 2px solid #e2e8f0; color: #334155; padding: 10px 18px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
        .quiz-count-chip:hover { border-color: #93c5fd; }
        .quiz-count-chip.selected { border-color: #3b82f6; background: #eff6ff; color: #1e40af; font-weight: 600; }
        .quiz-topic-banner { background: #f1f5f9; border-radius: 10px; padding: 10px 16px; font-size: 14px; color: #475569; margin-bottom: 20px; }

        .quiz-progress { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 8px; }
        .quiz-progress-bar { height: 8px; background: #e2e8f0; border-radius: 20px; overflow: hidden; }
        .quiz-progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 20px; transition: width 0.4s ease; }
        .quiz-question { font-size: 20px; color: #1e293b; margin: 28px 0 20px; line-height: 1.5; }
        .quiz-options { display: flex; flex-direction: column; gap: 12px; }
        .quiz-option { display: flex; align-items: center; gap: 14px; text-align: left; padding: 16px 18px; border: 2px solid #e2e8f0; border-radius: 14px; background: white; cursor: pointer; font-size: 15px; color: #334155; transition: all 0.2s ease; font-family: inherit; }
        .quiz-option:hover { border-color: #93c5fd; background: #f8fafc; }
        .quiz-option.selected { border-color: #3b82f6; background: #eff6ff; font-weight: 600; }
        .quiz-option-letter { width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #64748b; }
        .quiz-option.selected .quiz-option-letter { background: #3b82f6; color: white; }
        .quiz-nav { display: flex; justify-content: space-between; margin-top: 28px; gap: 12px; }

        .quiz-score-ring { width: 120px; height: 120px; margin: 0 auto 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; font-weight: 700; color: #1e293b; background: conic-gradient(#3b82f6 calc(var(--score) * 1%), #e2e8f0 0); }
        .quiz-score-ring span { width: 92px; height: 92px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .quiz-review { text-align: left; margin-top: 28px; display: flex; flex-direction: column; gap: 12px; }
        .quiz-review-item { padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .quiz-review-item.correct { background: #f0fdf4; border-color: #bbf7d0; }
        .quiz-review-item.wrong { background: #fef2f2; border-color: #fecaca; }
        .quiz-review-head { display: flex; align-items: flex-start; gap: 10px; color: #1e293b; }
        .quiz-review-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; flex-shrink: 0; }
        .quiz-review-item.correct .quiz-review-badge { background: #dcfce7; color: #166534; }
        .quiz-review-item.wrong .quiz-review-badge { background: #fee2e2; color: #991b1b; }
        .quiz-review-explain { margin: 10px 0 0 0; font-size: 14px; color: #475569; }

        .spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto; }
        .loading-state { text-align: center; padding: 60px 20px; }
        .loading-title { margin: 24px 0 8px 0; color: #1e293b; font-size: 18px; }
        .loading-desc { color: #64748b; }
        .highlight-text { color: #3b82f6; font-weight: 600; }

        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }

        @media (max-width: 900px) {
          .sidebar { position: fixed; top: 0; left: 0; height: 100%; transform: translateX(-100%); }
          .sidebar.kapali { width: 280px; padding: 24px; }
          .sidebar.open { transform: translateX(0); }
          .collapse-btn { display: none; }
          .sidebar-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 25; }
          .hamburger { display: block; }
          .page-content { padding: 24px 20px; }
          .page-title { font-size: 26px; }
          .page-subtitle { margin-bottom: 28px; }
          .navbar { padding: 0 20px; }
          .glass-card { padding: 24px; }
          .stat-grid { grid-template-columns: 1fr; }
          .user-name { display: none; }
          .quiz-nav { flex-direction: column-reverse; }
          .quiz-nav .btn-primary, .quiz-nav .btn-secondary { width: 100%; }
        }
      `}</style>
    </div>
  );
}
