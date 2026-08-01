import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { registerUser } from "./services/api";


function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
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


  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Lütfen bütün alanları doldurun.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError(
        "Geçerli bir e-posta adresi girin.",
      );
      return;
    }

    if (formData.password.length < 6) {
      setError(
        "Şifre en az 6 karakter olmalıdır.",
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        "Şifreler birbiriyle eşleşmiyor.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate(
        "/login",
        {
          replace: true,
          state: {
            registrationSuccess: true,
          },
        },
      );
    } catch (requestError) {
      setError(
        requestError.message ||
        "Kayıt işlemi tamamlanamadı.",
      );
    } finally {
      setIsLoading(false);
    }
  }


  return (
    <main className="auth-page">
      <section className="auth-introduction">
        <div className="brand">
          <div className="brand-icon">
            U
          </div>

          <span>
            UniMate <strong>AI</strong>
          </span>
        </div>

        <div className="introduction-content">
          <span className="eyebrow">
            Akademik ve kariyer yolculuğun
          </span>

          <h1>
            Hedeflerine ulaşmak için
            <span> ilk adımı at.</span>
          </h1>

          <p>
            UniMate hesabını oluştur,
            ders materyallerini analiz et ve
            kariyer gelişimini kişiselleştirilmiş
            önerilerle yönet.
          </p>

          <div className="feature-list">
            <div>
              ✓ Ders notlarından özet oluşturma
            </div>
            <div>
              ✓ Kişiselleştirilmiş quiz sonuçları
            </div>
            <div>
              ✓ CV analizi ve kariyer önerileri
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-section">
        <form
          className="auth-card"
          onSubmit={handleSubmit}
        >
          <div className="auth-heading">
            <span>UniMate’e katıl</span>
            <h2>Hesabını oluştur</h2>
            <p>
              Akademik çalışma alanını oluşturmaya başla.
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="fullName">
              Ad soyad
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Adınızı ve soyadınızı girin"
              value={formData.fullName}
              onChange={handleChange}
              autoComplete="name"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              E-posta adresi
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="ornek@email.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Şifre
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="En az 6 karakter"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Şifreyi tekrar gir
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading
              ? "Hesap oluşturuluyor..."
              : "Kayıt Ol"}
          </button>

          <p className="auth-switch">
            Zaten hesabın var mı?
            <Link to="/login">
              {" "}Giriş yap
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}


export default Register;