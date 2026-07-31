# UniMate AI — Frontend (Dashboard & Agent Ekranları)

MindForce (Grup 26) tarafından geliştirilen UniMate AI uygulamasının frontend katmanıdır. Uygulama; üniversite öğrencilerinin akademik ve kariyer gelişimini tek panelden yönetmesini sağlayan çok ajanlı bir yapay zeka asistanıdır. Bu depo Study Agent, Career Agent, Coach Agent, Quiz ve Dashboard ekranlarının arayüzünü ve backend'e bağlanacak servis katmanını içerir.

## Kullanılan Teknolojiler

- React 19
- Vite
- Saf CSS (tema tek dosyada, `App.jsx` içindeki style bloğunda)
- ESLint

## Kurulum ve Çalıştırma

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` komutu geliştirme sunucusunu başlatır ve tarayıcıda `http://localhost:5173` adresini açar. Diğer komutlar; kod kontrolü için `npm run lint`, teslim derlemesi için `npm run build`, derlemeyi önizlemek için `npm run preview` şeklindedir.

## Proje Yapısı

```
src/
  App.jsx                 Ana uygulama, sidebar, dashboard ve sayfa yönlendirmesi
  CareerAgent.jsx         CV yükleme ve analiz sonucu ekranı
  QuizAgent.jsx           Quiz oluşturma ve soru cevap akışı
  CoachCard.jsx           Haftalık koçluk önerisi kartı
  NavIcons.jsx            Menü ikonları ve mezuniyet capi çizimi
  components/
    StateComponents.jsx   Ortak loading, hata ve boş durum bileşenleri
  services/
    api.js                Ortak fetch yardımcısı, token ve dosya doğrulama
    careerAgent.js        CV analizi, iş ilanı eşleştirme, geçmiş servisleri
    quizAgent.js          Quiz üretimi ve sonuç kaydı servisleri
    coachAgent.js         Koç önerisi servisi
    studyAgent.js         Ders materyali özetleme servisi
```

## Yapılanlar

Uygulamanın frontend tarafı bu depoda tamamlanmıştır. Sol menü açılıp kapanabilir; kapandığında logo mezuniyet capine dönüşür ve menü öğeleri ikonlara indirgenir. Dashboard ekranı Study, Career ve Coach sonuçlarını tek panelde toplar; son yüklenen dosyalar, haftalık ilerleme ve hedef kartları burada gösterilir. Career Agent ekranında kullanıcı CV yükler, sonuç ekranında puan, teknik ve sosyal beceriler, eksik alanlar ve öneriler listelenir. Quiz ekranında kullanıcı ders özetlerinden ya da eski dosya konularından konu seçebilir, kendi konusunu yazabilir veya PDF ya da görsel yükleyerek quiz oluşturabilir; soru cevap akışı ve sonuç değerlendirmesi hazırdır. Coach kartında akademik ve kariyer hedefleri için tamamlandı işareti, süreyi gösteren analog bir sayaç ve hedef tamamlanınca yeni konu getirme davranışı bulunur. Tüm ekranlar responsive olup ortak loading, hata ve boş durum bileşenlerini kullanır.

## Yapılacaklar ve Backend Bağlantı Noktaları

Frontend, backend hazır olduğunda gerçek veriyle çalışacak şekilde kurgulanmıştır. Servis dosyalarındaki her fonksiyon ilgili endpoint'e istek atar ve bağlantı noktası kod içinde kısa bir not ile işaretlenmiştir. Backend ekibi bu endpoint'leri sağladığında `.env` dosyasındaki `VITE_API_URL` değeri girilerek uygulama gerçek veriye bağlanır. Beklenen bağlantılar şunlardır.

- Ders materyali özetleme için `services/studyAgent.js` içindeki fonksiyon `POST /api/study/summarize` adresine dosya gönderir ve yanıt olarak `baslik`, `anaTemalar` ve `onemliNoktalar` alanlarını bekler.
- CV analizi için `services/careerAgent.js` içindeki fonksiyon `POST /api/career/analyze` adresine CV dosyasını gönderir ve `score`, `education`, `experience`, `technical_skills`, `soft_skills`, `missing_areas`, `recommendations` alanlarını bekler.
- Quiz üretimi için `services/quizAgent.js` içindeki fonksiyon `POST /api/quiz/generate` adresine konu ya da dosya gönderir ve `quizId`, `konu` ile birlikte `questions` listesini bekler. Her soru `question`, `options`, `correctIndex` ve `explanation` alanlarını içerir.
- Quiz sonucu kaydı için aynı dosyadaki fonksiyon `POST /api/quiz/submit` adresine cevapları gönderir ve `score`, `correct`, `total` alanlarını bekler.
- Koç önerisi için `services/coachAgent.js` içindeki fonksiyon `POST /api/coach/recommend` adresine Study ve Career sonuçlarını gönderir ve `mesaj`, `hedefler` ile `haftalikIlerleme` alanlarını bekler.
- Kimlik doğrulama tarafında `services/api.js` isteklere `localStorage` içindeki `unimate_token` değerini Authorization başlığı olarak ekler. Giriş akışı bu değeri kaydettiğinde korumalı istekler otomatik olarak çalışır.

Backend yanıtları yukarıdaki alan adlarıyla döndüğünde ekranlarda başka bir değişiklik yapılmasına gerek kalmadan veriler görüntülenir.

## Ortam Değişkenleri

`.env` dosyasında yalnızca backend adresi tutulur.

```
VITE_API_URL=http://localhost:8000
```
