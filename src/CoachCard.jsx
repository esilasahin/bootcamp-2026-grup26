import { useState, useRef, useEffect } from "react";
import { LoadingState } from "./components/StateComponents";

const SURE_SN = 60;

const HAVUZ = {
  academic: [
    "Bir sonraki quiz için 'Nöral Ağlar' konusunu araştır.",
    "Ders özetindeki en zayıf konuyu 30 dakika tekrar et.",
    "Konuyla ilgili bir akademik makale okuyup kısa özet çıkar.",
    "Bir önceki quizde yanlış yaptığın soruları yeniden çöz.",
  ],
  career: [
    "LinkedIn profiline 2 yeni teknik beceri ekle.",
    "Bir açık kaynak projeye ilk katkını (PR) gönder.",
    "CV'ndeki eksik alan için kısa bir online kurs bul.",
    "Sektörden bir kişiyle bağlantı kurup kısa görüşme iste.",
  ],
};

function DeadlineRing({ oran, tamam, doldu }) {
  const r = 15;
  const cevre = 2 * Math.PI * r;
  const gosterilen = tamam ? 1 : oran;
  const offset = cevre * (1 - gosterilen);

  let renk = "#3b82f6";
  if (tamam) renk = "#16a34a";
  else if (doldu || oran > 0.85) renk = "#ef4444";
  else if (oran > 0.6) renk = "#f59e0b";

  return (
    <svg className="coach-ring" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r={r} className="coach-ring-bg" />
      <circle
        cx="18"
        cy="18"
        r={r}
        className="coach-ring-fg"
        stroke={renk}
        strokeDasharray={cevre}
        strokeDashoffset={offset}
      />
      {tamam && <path d="M13 18 l3.5 3.5 l7 -7.5" className="coach-ring-check" />}
    </svg>
  );
}

export default function CoachCard({ coach, yukleniyor, onYenile }) {
  const [hedefler, setHedefler] = useState(() =>
    (coach?.hedefler || []).map((h, i) => ({
      id: i + 1,
      tip: h.tip,
      metin: h.metin,
      baslangicTick: 0,
      tamam: false,
      doldu: false,
    }))
  );
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);
  const havuzRef = useRef({ academic: 0, career: 0 });

  useEffect(() => {
    const t = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);
      setHedefler((prev) =>
        prev.map((h) =>
          !h.tamam && !h.doldu && tickRef.current - h.baslangicTick >= SURE_SN
            ? { ...h, doldu: true }
            : h
        )
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const tamamla = (id) => {
    setHedefler((prev) => prev.map((h) => (h.id === id ? { ...h, tamam: true } : h)));
    setTimeout(() => {
      setHedefler((prev) =>
        prev.map((h) => {
          if (h.id !== id) return h;
          const havuz = HAVUZ[h.tip];
          const idx = havuzRef.current[h.tip] % havuz.length;
          havuzRef.current[h.tip] += 1;
          return { ...h, metin: havuz[idx], baslangicTick: tickRef.current, tamam: false, doldu: false };
        })
      );
    }, 1600);
  };

  return (
    <div className="glass-card coach-card">
      <div className="coach-card-head">
        <h3 className="section-title" style={{ margin: 0 }}>Haftalık Koçluk Önerisi</h3>
        {onYenile && (
          <button className="coach-refresh" onClick={onYenile} disabled={yukleniyor}>
            {yukleniyor ? "Güncelleniyor..." : "Yenile"}
          </button>
        )}
      </div>

      {yukleniyor && !coach ? (
        <LoadingState title="Koç önerini hazırlıyor..." />
      ) : (
        coach && (
          <>
            <p className="coach-message">"{coach.mesaj}"</p>

            {typeof coach.haftalikIlerleme === "number" && (
              <div className="coach-progress">
                <div className="coach-progress-label">
                  <span>Haftalık İlerleme</span>
                  <strong>%{coach.haftalikIlerleme}</strong>
                </div>
                <div className="quiz-progress-bar">
                  <div className="quiz-progress-fill" style={{ width: `${coach.haftalikIlerleme}%` }} />
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
              {hedefler.map((h) => {
                const oran = Math.min(1, (tick - h.baslangicTick) / SURE_SN);
                return (
                  <div key={h.id} className={`coach-goal ${h.tip} ${h.tamam ? "tamam" : ""} ${h.doldu ? "doldu" : ""}`}>
                    <button
                      className="coach-check"
                      onClick={() => tamamla(h.id)}
                      disabled={h.tamam}
                      aria-label="Tamamlandı olarak işaretle"
                    >
                      {h.tamam && <span className="coach-check-mark" />}
                    </button>

                    <div className="coach-goal-body">
                      <strong className="coach-goal-title">
                        {h.tip === "academic" ? "Akademik Hedef" : "Kariyer Hedefi"}
                      </strong>
                      <span className="coach-goal-text">{h.metin}</span>
                      {h.tamam && <span className="coach-goal-ok">Tamamlandı · yeni konu getiriliyor...</span>}
                      {h.doldu && !h.tamam && <span className="coach-goal-uyari">Süre doldu · Tamamlanmadı</span>}
                    </div>

                    <DeadlineRing oran={oran} tamam={h.tamam} doldu={h.doldu} />
                  </div>
                );
              })}
            </div>
          </>
        )
      )}
    </div>
  );
}
