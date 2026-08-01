import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Lütfen e-posta ve şifre alanlarını doldurun.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }

    setIsLoading(true);

    // Backend hazır olana kadar geçici giriş işlemi
    setTimeout(() => {
      localStorage.setItem("token", "temporary-demo-token");
      setIsLoading(false);
      navigate("/dashboard");
    }, 700);
  }

  return (
    <main className="auth-page">
      <section className="auth-introduction">
        <div className="brand">
          <div className="brand-icon">U</div>
          <span>
            UniMate <strong>AI</strong>
          </span>
        </div>

        <div className="introduction-content">
          <span className="eyebrow">Akademik ve kariyer asistanın</span>

          <h1>
            Üniversite yolculuğunu
            <span> yapay zekâyla yönet.</span>
          </h1>

          <p>
            Ders materyallerini analiz et, kişisel çalışma planını oluştur
            ve kariyer gelişimini tek platformdan takip et.
          </p>

          <div className="feature-list">
            <div>✓ Yapay zekâ destekli ders özetleri</div>
            <div>✓ Kişiselleştirilmiş çalışma planları</div>
            <div>✓ CV analizi ve kariyer önerileri</div>
          </div>
        </div>
      </section>

      <section className="auth-form-section">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-heading">
            <span>Tekrar hoş geldin</span>
            <h2>Hesabına giriş yap</h2>
            <p>UniMate çalışma alanına devam et.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">E-posta adresi</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@email.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="password-label">
              <label htmlFor="password">Şifre</label>
              <button type="button" className="text-button">
                Şifremi unuttum
              </button>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Şifrenizi girin"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          <p className="auth-switch">
            Henüz hesabın yok mu?
            <Link to="/register"> Kayıt ol</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;