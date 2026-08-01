import { useState, useRef } from "react";
import { generateQuiz, submitQuiz } from "./services/quizAgent";
import { validateFile } from "./services/api";
import { LoadingState, ErrorState } from "./components/StateComponents";

export default function QuizAgent({ studyResult, konular = [], onQuizComplete }) {
  const [durum, setDurum] = useState("idle");
  const [hataMesaji, setHataMesaji] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [cevaplar, setCevaplar] = useState([]);
  const [aktifSoru, setAktifSoru] = useState(0);
  const [sonuc, setSonuc] = useState(null);

  const [secilenKonu, setSecilenKonu] = useState(null);
  const [ozelKonu, setOzelKonu] = useState("");
  const [dosya, setDosya] = useState(null);
  const [soruSayisi, setSoruSayisi] = useState(3);

  const dosyaRef = useRef(null);

  const konuSec = (konu) => {
    setSecilenKonu(konu);
    setOzelKonu("");
    setDosya(null);
  };

  const ozelKonuYaz = (deger) => {
    setOzelKonu(deger);
    setSecilenKonu(null);
    setDosya(null);
  };

  const dosyaSecildi = (event) => {
    const secilen = event.target.files[0];
    if (!secilen) return;
    const hata = validateFile(secilen, { allowed: ["pdf", "jpg", "jpeg", "png"], maxMB: 5 });
    if (hata) {
      setHataMesaji(hata);
      return;
    }
    setHataMesaji("");
    setDosya(secilen);
    setSecilenKonu(null);
    setOzelKonu("");
  };

  const kaynakHazir = Boolean(secilenKonu || ozelKonu.trim() || dosya);

  const quizBaslat = async () => {
    if (!kaynakHazir) return;
    setHataMesaji("");
    setDurum("loading");
    const konuAdi = ozelKonu.trim() || secilenKonu || (dosya ? dosya.name : "Genel Konu");
    try {
      const data = await generateQuiz({
        konu: konuAdi,
        dosya: dosya || undefined,
        documentId: studyResult?.documentId,
        soruSayisi,
      });
      setQuiz(data);
      setCevaplar(new Array(data.questions.length).fill(null));
      setAktifSoru(0);
      setDurum("active");
    } catch (error) {
      setHataMesaji(error.message);
      setDurum("idle");
    }
  };

  const sikSec = (soruIndex, sikIndex) => {
    setCevaplar((prev) => {
      const kopya = [...prev];
      kopya[soruIndex] = sikIndex;
      return kopya;
    });
  };

  const quizGonder = async () => {
    setDurum("submitting");
    setHataMesaji("");
    try {
      const data = await submitQuiz(quiz.quizId, cevaplar);
      setSonuc(data);
      setDurum("done");
      onQuizComplete?.({ ...data, konu: quiz.konu });
    } catch (error) {
      setHataMesaji(error.message);
      setDurum("active");
    }
  };

  const sifirla = () => {
    setDurum("idle");
    setQuiz(null);
    setSonuc(null);
    setCevaplar([]);
    setAktifSoru(0);
    setHataMesaji("");
  };

  const tumSorularCevaplandi = cevaplar.length > 0 && cevaplar.every((c) => c !== null);

  return (
    <div className="fade-in">
      <h1 className="page-title">Quiz</h1>
      <p className="page-subtitle">
        Yüklediğin ders notlarından bir konu seç, kendi konunu yaz ya da bir görsel yükle; yapay zeka sana özel bir test hazırlasın.
      </p>

      <ErrorState message={hataMesaji} onRetry={durum === "idle" ? quizBaslat : undefined} />

      {durum === "idle" && (
        <div className="glass-card">
          <h3 className="section-title" style={{ marginTop: 0 }}>Quiz için bir kaynak seç</h3>

          {konular.length > 0 && (
            <>
              <h4 className="quiz-setup-label">Eski PDF'lerinden veya ders özetlerinden konu</h4>
              <div className="quiz-topic-list">
                {konular.map((k) => (
                  <button
                    key={k}
                    className={`quiz-topic-chip ${secilenKonu === k ? "selected" : ""}`}
                    onClick={() => konuSec(k)}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </>
          )}

          <h4 className="quiz-setup-label">Kendi konunu yaz</h4>
          <input
            className="quiz-topic-input"
            value={ozelKonu}
            placeholder="örn. Veri Yapıları, Türev, Makine Öğrenmesi"
            onChange={(e) => ozelKonuYaz(e.target.value)}
          />

          <h4 className="quiz-setup-label">veya PDF / görsel yükleyerek oluştur</h4>
          <div
            className={`quiz-image-card ${dosya ? "selected" : ""}`}
            onClick={() => dosyaRef.current.click()}
          >
            <input
              type="file"
              ref={dosyaRef}
              onChange={dosyaSecildi}
              accept=".pdf, .jpg, .jpeg, .png"
              style={{ display: "none" }}
            />
            {dosya ? (
              <span className="quiz-image-name">Seçilen dosya: {dosya.name}</span>
            ) : (
              <span className="quiz-image-hint">Ders notu PDF'i veya slayt görseli yükle (PDF, JPG, PNG - Maks 5MB)</span>
            )}
          </div>

          <h4 className="quiz-setup-label">Soru sayısı</h4>
          <div className="quiz-count-list">
            {[3, 5, 10].map((n) => (
              <button
                key={n}
                className={`quiz-count-chip ${soruSayisi === n ? "selected" : ""}`}
                onClick={() => setSoruSayisi(n)}
              >
                {n} soru
              </button>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: "28px", opacity: kaynakHazir ? 1 : 0.5 }}
            disabled={!kaynakHazir}
            onClick={quizBaslat}
          >
            Quiz Oluştur
          </button>
        </div>
      )}

      {durum === "loading" && (
        <div className="glass-card">
          <LoadingState title="Quiz Hazırlanıyor..." desc="Yapay zeka sorularını üretiyor." />
        </div>
      )}

      {(durum === "active" || durum === "submitting") && quiz && (
        <div className="glass-card">
          <div className="quiz-topic-banner">Konu: <strong>{quiz.konu}</strong></div>
          <div className="quiz-progress">
            <span>Soru {aktifSoru + 1} / {quiz.questions.length}</span>
            <span>{cevaplar.filter((c) => c !== null).length} cevaplandı</span>
          </div>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((aktifSoru + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>

          <h3 className="quiz-question">{quiz.questions[aktifSoru].question}</h3>

          <div className="quiz-options">
            {quiz.questions[aktifSoru].options.map((secenek, i) => {
              const secili = cevaplar[aktifSoru] === i;
              return (
                <button
                  key={i}
                  className={`quiz-option ${secili ? "selected" : ""}`}
                  onClick={() => sikSec(aktifSoru, i)}
                  disabled={durum === "submitting"}
                >
                  <span className="quiz-option-letter">{String.fromCharCode(65 + i)}</span>
                  {secenek}
                </button>
              );
            })}
          </div>

          <div className="quiz-nav">
            <button
              className="btn-secondary"
              onClick={() => setAktifSoru((s) => Math.max(0, s - 1))}
              disabled={aktifSoru === 0}
              style={{ opacity: aktifSoru === 0 ? 0.4 : 1 }}
            >
              Önceki
            </button>

            {aktifSoru < quiz.questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setAktifSoru((s) => s + 1)}>
                Sonraki
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={quizGonder}
                disabled={!tumSorularCevaplandi || durum === "submitting"}
                style={{ opacity: !tumSorularCevaplandi ? 0.5 : 1 }}
              >
                {durum === "submitting" ? "Değerlendiriliyor..." : "Testi Bitir"}
              </button>
            )}
          </div>
        </div>
      )}

      {durum === "done" && sonuc && (
        <div className="glass-card fade-in text-center">
          <div className="quiz-score-ring" style={{ "--score": sonuc.score }}>
            <span>{sonuc.score}</span>
          </div>
          <h3 className="empty-state-title">
            {sonuc.score >= 70 ? "Tebrikler!" : "İyi bir başlangıç!"}
          </h3>
          <p className="empty-state-desc">
            {quiz.questions.length} sorudan <strong>{sonuc.correct}</strong> tanesini doğru
            yanıtladın. Sonucun Dashboard'a kaydedildi.
          </p>

          <div className="quiz-review">
            {quiz.questions.map((q, i) => {
              const dogru = cevaplar[i] === q.correctIndex;
              return (
                <div key={q.id} className={`quiz-review-item ${dogru ? "correct" : "wrong"}`}>
                  <div className="quiz-review-head">
                    <span className="quiz-review-badge">{dogru ? "Doğru" : "Yanlış"}</span>
                    <strong>{q.question}</strong>
                  </div>
                  {!dogru && (
                    <p className="quiz-review-explain">
                      Doğru cevap: <strong>{q.options[q.correctIndex]}</strong> — {q.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button className="btn-primary" onClick={sifirla} style={{ marginTop: "24px" }}>
            Yeni Quiz Çöz
          </button>
        </div>
      )}
    </div>
  );
}
