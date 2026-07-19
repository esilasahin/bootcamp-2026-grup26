# Study Agent ve Özet Servisi — Hüseyin Tutak
Bu bölüm Hüseyin Tutak tarafından güncellenecektir.

Bu görev kapsamında planlanan çalışmalar:

* [x] LLM servisi bağlantısı (Mock Altyapı ve Soyut Sınıf ile)
* [x] Uzun metinlerin parçalara ayrılması (Chunking)
* [ ] Study Agent sistem promptunun hazırlanması
* [ ] Ders materyallerinin analiz edilmesi
* [x] Belge özetinin oluşturulması (Pydantic Modelleri ile)
* [x] Önemli noktaların çıkarılması
* [x] JSON formatında çıktı üretilmesi
* [x] Summary endpointinin hazırlanması (/api/summary)
* [x] Başarısız LLM isteklerinin yönetilmesi (Hata yönetimi ve HTTPException)
* [x] Üretilen sonuçların veritabanına kaydedilmesi (Mock DB ile)
* [x] Özet sonucunun frontend'e gönderilmesi

## Proje Yapısı

Bu MVP modülü FastAPI kullanılarak geliştirilmiştir. 

```
app/
├── api/
│   └── routes.py         # /api/summary endpoint'i
├── models/
│   └── schemas.py        # Pydantic modelleri (SummaryResponse, vs.)
├── services/
│   ├── chunking.py       # Metin parçalama fonksiyonu
│   ├── db_mock.py        # Mock veritabanı kayıt işlemi
│   └── llm_provider.py   # BaseLLMProvider ve MockLLMProvider
└── main.py               # FastAPI uygulamasının ana giriş noktası
```

## Kurulum ve Çalıştırma

Gerekli kütüphaneleri yüklemek için (virtual environment önerilir):
```bash
pip install fastapi[all] pydantic
```

Projeyi başlatmak için aşağıdaki komutu çalıştırın:
```bash
uvicorn app.main:app --reload
```

Uygulama çalıştıktan sonra interaktif API dokümantasyonuna şu adresten ulaşabilirsiniz:
* Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
* ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
