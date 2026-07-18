import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-logo">U</div>

          <div>
            <h1>UniMate AI</h1>
            <p>Akademik ve kariyer asistanın</p>
          </div>
        </div>

        <nav className="dashboard-navigation" aria-label="Dashboard menüsü">
          <div className="dashboard-nav-item dashboard-nav-item-active">
            Dashboard
          </div>

          <div className="dashboard-nav-item">
            Study Agent
            <span>Yakında</span>
          </div>

          <div className="dashboard-nav-item">
            Career Agent
            <span>Yakında</span>
          </div>

          <div className="dashboard-nav-item">
            Coach Agent
            <span>Yakında</span>
          </div>
        </nav>

        <button
          type="button"
          className="dashboard-logout-button"
          onClick={handleLogout}
        >
          Çıkış Yap
        </button>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-header-label">UniMate AI</p>
            <h2>Dashboard</h2>
          </div>
        </header>

        <section className="dashboard-welcome">
          <p className="dashboard-welcome-label">Hoş geldin</p>

          <h3>Akademik gelişimini tek bir yerden yönet.</h3>

          <p>
            Belgelerini yükleyerek Study Agent ile özet oluşturabilecek,
            ilerleyen adımlarda diğer yapay zekâ asistanlarını
            kullanabileceksin.
          </p>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;