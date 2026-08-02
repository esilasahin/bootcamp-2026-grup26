import { useEffect, useRef, useState } from "react";
import { LoadingState } from "./components/StateComponents";

const SURE_SN = 7 * 24 * 60 * 60;

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

function createGoals(coach) {
  return (coach?.hedefler || []).map((hedef, index) => ({
    id: index + 1,
    tip: hedef.tip,
    metin: hedef.metin,
    baslangicTick: 0,
    tamam: false,
    doldu: false,
  }));
}

function DeadlineRing({ oran, tamam, doldu }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const displayedRatio = tamam ? 1 : oran;
  const offset = circumference * (1 - displayedRatio);

  let color = "#3b82f6";

  if (tamam) {
    color = "#16a34a";
  } else if (doldu || oran > 0.85) {
    color = "#ef4444";
  } else if (oran > 0.6) {
    color = "#f59e0b";
  }

  return (
    <svg className="coach-ring" viewBox="0 0 36 36">
      <circle
        cx="18"
        cy="18"
        r={radius}
        className="coach-ring-bg"
      />

      <circle
        cx="18"
        cy="18"
        r={radius}
        className="coach-ring-fg"
        stroke={color}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />

      {tamam && (
        <path
          d="M13 18 l3.5 3.5 l7 -7.5"
          className="coach-ring-check"
        />
      )}
    </svg>
  );
}

export default function CoachCard({
  coach,
  yukleniyor,
  onYenile,
}) {
  const [hedefler, setHedefler] = useState(() =>
    createGoals(coach),
  );

  const [tick, setTick] = useState(0);
  const [tamamlananHedefSayisi, setTamamlananHedefSayisi] =
    useState(0);

  const tickRef = useRef(0);
  const havuzRef = useRef({
    academic: 0,
    career: 0,
  });

  const toplamHedefSayisi =
    coach?.hedefler?.length || hedefler.length;

  const haftalikIlerleme =
    toplamHedefSayisi > 0
      ? Math.min(
          100,
          Math.round(
            (tamamlananHedefSayisi /
              toplamHedefSayisi) *
              100,
          ),
        )
      : 0;

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;
      setTick(tickRef.current);

      setHedefler((previousGoals) =>
        previousGoals.map((hedef) => {
          const timeExpired =
            tickRef.current - hedef.baslangicTick >=
            SURE_SN;

          if (
            !hedef.tamam &&
            !hedef.doldu &&
            timeExpired
          ) {
            return {
              ...hedef,
              doldu: true,
            };
          }

          return hedef;
        }),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const tamamla = (id) => {
    const hedef = hedefler.find(
      (item) => item.id === id,
    );

    if (!hedef || hedef.tamam) {
      return;
    }

    setHedefler((previousGoals) =>
      previousGoals.map((item) =>
        item.id === id
          ? {
              ...item,
              tamam: true,
            }
          : item,
      ),
    );

    setTamamlananHedefSayisi((previousCount) =>
      Math.min(
        previousCount + 1,
        toplamHedefSayisi,
      ),
    );

    setTimeout(() => {
      setHedefler((previousGoals) =>
        previousGoals.map((item) => {
          if (item.id !== id) {
            return item;
          }

          const pool = HAVUZ[item.tip];
          const poolIndex =
            havuzRef.current[item.tip] % pool.length;

          havuzRef.current[item.tip] += 1;

          return {
            ...item,
            metin: pool[poolIndex],
            baslangicTick: tickRef.current,
            tamam: false,
            doldu: false,
          };
        }),
      );
    }, 1600);
  };

  return (
    <div className="glass-card coach-card">
      <div className="coach-card-head">
        <h3
          className="section-title"
          style={{ margin: 0 }}
        >
          Haftalık Koçluk Önerisi
        </h3>

        {onYenile && (
          <button
            className="coach-refresh"
            onClick={onYenile}
            disabled={yukleniyor}
          >
            {yukleniyor
              ? "Güncelleniyor..."
              : "Yenile"}
          </button>
        )}
      </div>

      {yukleniyor && !coach ? (
        <LoadingState title="Koç önerini hazırlıyor..." />
      ) : (
        coach && (
          <>
            <p className="coach-message">
              "{coach.mesaj}"
            </p>

            <div className="coach-progress">
              <div className="coach-progress-label">
                <span>Haftalık İlerleme</span>
                <strong>%{haftalikIlerleme}</strong>
              </div>

              <div className="quiz-progress-bar">
                <div
                  className="quiz-progress-fill"
                  style={{
                    width: `${haftalikIlerleme}%`,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              {hedefler.map((hedef) => {
                const ratio = Math.min(
                  1,
                  (tick - hedef.baslangicTick) /
                    SURE_SN,
                );

                const className = [
                  "coach-goal",
                  hedef.tip,
                  hedef.tamam ? "tamam" : "",
                  hedef.doldu ? "doldu" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={hedef.id}
                    className={className}
                  >
                    <button
                      type="button"
                      className="coach-check"
                      onClick={() =>
                        tamamla(hedef.id)
                      }
                      disabled={hedef.tamam}
                      aria-label={
                        "Tamamlandı olarak işaretle"
                      }
                    >
                      {hedef.tamam && (
                        <span className="coach-check-mark" />
                      )}
                    </button>

                    <div className="coach-goal-body">
                      <strong className="coach-goal-title">
                        {hedef.tip === "academic"
                          ? "Akademik Hedef"
                          : "Kariyer Hedefi"}
                      </strong>

                      <span className="coach-goal-text">
                        {hedef.metin}
                      </span>

                      {hedef.tamam && (
                        <span className="coach-goal-ok">
                          Tamamlandı · yeni konu
                          getiriliyor...
                        </span>
                      )}

                      {hedef.doldu &&
                        !hedef.tamam && (
                          <span className="coach-goal-uyari">
                            Süre doldu · Tamamlanmadı
                          </span>
                        )}
                    </div>

                    <DeadlineRing
                      oran={ratio}
                      tamam={hedef.tamam}
                      doldu={hedef.doldu}
                    />
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