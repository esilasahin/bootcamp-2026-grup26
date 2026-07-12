"""
OCR Service
-----------
Bu dosya, kullanıcının yüklediği PDF veya görsel dosyalardan metin çıkarma
işlemlerinin tamamını içerir.

Akış:
1. PDF ise -> önce metin katmanı var mı kontrol edilir (pdfplumber)
2. Metin yoksa -> sayfa görsele çevrilir (pdf2image) ve OCR uygulanır (pytesseract)
3. Görsel (JPG/PNG) ise -> direkt OCR uygulanır
4. Çıkan metin temizlenir (boşluk, satır sonu vb.)
5. Sonuç, Study Agent'ın kullanabileceği standart bir formatta döndürülür
"""

import os
import re

import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image


# ---------------------------------------------------------------------------
# AYARLAR
# ---------------------------------------------------------------------------

DPI = 300  # PDF sayfalarını görsele çevirirken kullanılacak çözünürlük
OCR_LANG = "tur"  # Tesseract dil paketi (Türkçe)
SUPPORTED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}

# Tesseract'ın bir kelimeyi "gerçek metin" sayması için gereken minimum
# güven skoru (0-100 arası). Bunun altındaki kelimeler genelde resim
# dokusundan (yaprak, yansıma vb.) "uydurulmuş" anlamsız kelimelerdir.
OCR_CONFIDENCE_THRESHOLD = 85

# Bir PDF sayfasında "metin var" sayılması için gereken minimum karakter sayısı.
MIN_TEXT_LENGTH_THRESHOLD = 20

# Harf-apostrof-harf paterni (örn. "met'n"): bazı PDF üretim araçları (Canva,
# Figma gibi) özel font gömdüğünde "i" harfini yanlış karaktere eşleyip
# apostrof gibi görünmesine sebep olabiliyor. Bu regex, pdfplumber'dan
# çekilen metnin böyle bozuk olup olmadığını tespit etmek için kullanılır.
SUSPICIOUS_GLYPH_PATTERN = re.compile(
    r"[a-zA-ZçÇğĞıİöÖşŞüÜ]['’][a-zA-ZçÇğĞıİöÖşŞüÜ]"
)
SUSPICIOUS_GLYPH_THRESHOLD = 2  # bu sayıdan fazla eşleşme varsa metne güvenme


def _is_text_reliable(text: str) -> bool:
    """
    pdfplumber'dan çekilen metnin güvenilir olup olmadığını kontrol eder.
    Bozuk font kodlaması belirtisi (kelime içinde tek apostrof) çok sayıda
    tekrarlıyorsa, bu metne güvenmek yerine OCR'a düşmek daha doğrudur.
    """
    matches = SUSPICIOUS_GLYPH_PATTERN.findall(text)
    return len(matches) <= SUSPICIOUS_GLYPH_THRESHOLD


# ---------------------------------------------------------------------------
# 1) PDF'TEN DİREKT METİN ÇIKARMA
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_path: str) -> dict:
    """
    PDF dosyasını sayfa sayfa açar ve metin katmanı olan sayfalardan
    doğrudan metni çeker. Metin katmanı olmayan (örn. taranmış) sayfaları
    ayrıca "ocr_needed" listesinde işaretler.

    Dönüş:
        {
            "pages": {0: "sayfa metni", 1: "", 2: "sayfa metni"},
            "ocr_needed_pages": [1],   # metin bulunamayan sayfa indeksleri
            "total_pages": 3
        }
    """
    pages_text = {}
    ocr_needed_pages = []

    with pdfplumber.open(file_path) as pdf:
        total_pages = len(pdf.pages)

        for index, page in enumerate(pdf.pages):
            raw_text = page.extract_text() or ""
            stripped = raw_text.strip()

            has_enough_text = len(stripped) >= MIN_TEXT_LENGTH_THRESHOLD
            is_reliable = _is_text_reliable(stripped)

            if has_enough_text and is_reliable:
                pages_text[index] = stripped
            else:
                # Metin yok, ya da bozuk font kodlaması nedeniyle güvenilmez
                # (örn. 'i' harflerinin apostrofa dönüştüğü durumlar).
                # Bu sayfa için OCR uygulanacak.
                pages_text[index] = ""
                ocr_needed_pages.append(index)

    return {
        "pages": pages_text,
        "ocr_needed_pages": ocr_needed_pages,
        "total_pages": total_pages,
    }


# ---------------------------------------------------------------------------
# 2) METİNSİZ PDF SAYFALARINI GÖRSELE ÇEVİRME
# ---------------------------------------------------------------------------

def convert_pdf_page_to_image(file_path: str, page_number: int) -> Image.Image:
    """
    Belirtilen PDF sayfasını (0-index tabanlı) bir PIL Image nesnesine çevirir.
    pdf2image kütüphanesi sayfa numaralarını 1'den başlattığı için burada
    page_number + 1 kullanıyoruz.
    """
    images = convert_from_path(
        file_path,
        dpi=DPI,
        first_page=page_number + 1,
        last_page=page_number + 1,
    )

    if not images:
        raise ValueError(f"Sayfa {page_number} görsele çevrilemedi.")

    return images[0]


# ---------------------------------------------------------------------------
# 3) GÖRSEL ÜZERİNDEN OCR
# ---------------------------------------------------------------------------

def run_ocr_on_image(image: Image.Image) -> str:
    """
    Verilen görsel üzerinde Tesseract OCR çalıştırır.

    image_to_string yerine image_to_data kullanıyoruz çünkü bu, her kelime
    için ayrı bir güven skoru (confidence) döndürüyor. Resim dokusundan
    (yaprak, yansıma, desen vb.) "uydurulan" anlamsız kelimeler genelde
    düşük güven skoruyla gelir; bunları filtreleyerek daha temiz bir
    sonuç elde ediyoruz.
    """
    data = pytesseract.image_to_data(
        image, lang=OCR_LANG, output_type=pytesseract.Output.DICT
    )

    # Kelimeleri satır satır gruplamak için (block, paragraf, satır) anahtarını kullan
    lines = {}
    word_count = len(data["text"])

    for i in range(word_count):
        word = data["text"][i].strip()
        if not word:
            continue

        try:
            confidence = int(data["conf"][i])
        except (ValueError, TypeError):
            confidence = -1

        if confidence < OCR_CONFIDENCE_THRESHOLD:
            continue  # düşük güvenli kelimeyi atla (muhtemelen gürültü)

        line_key = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
        lines.setdefault(line_key, []).append(word)

    ordered_lines = [" ".join(words) for words in lines.values()]
    return "\n".join(ordered_lines)


# ---------------------------------------------------------------------------
# 4) METİN TEMİZLEME
# ---------------------------------------------------------------------------

def clean_ocr_text(raw_text: str) -> str:
    """
    OCR çıktısındaki gereksiz boşlukları, fazla satır sonlarını temizler.
    Türkçe karakterlere (ç, ş, ğ, ı, ö, ü) dokunmaz, sadece formatlamayı düzeltir.
    """
    if not raw_text:
        return ""

    # Birden fazla boşluğu tek boşluğa indir
    text = re.sub(r"[ \t]+", " ", raw_text)

    # Birden fazla satır sonunu en fazla 2 satır sonuna indir (paragraf ayrımı için)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Satır başı/sonu boşluklarını temizle
    lines = [line.strip() for line in text.split("\n")]
    text = "\n".join(lines)

    return text.strip()


# ---------------------------------------------------------------------------
# 5) ANA ORKESTRATÖR FONKSİYON
# ---------------------------------------------------------------------------

def process_uploaded_file(file_path: str) -> dict:
    """
    Yüklenen dosyayı (PDF veya görsel) işler ve Study Agent'a gönderilecek
    standart formatta bir sonuç döndürür.

    Dönüş formatı:
        {
            "success": bool,
            "text": str,
            "page_count": int,
            "method": "pdf_text" | "ocr" | "mixed",
            "error": str | None
        }
    """
    extension = os.path.splitext(file_path)[1].lower()

    if extension not in SUPPORTED_EXTENSIONS:
        return {
            "success": False,
            "text": "",
            "page_count": 0,
            "method": None,
            "error": f"Desteklenmeyen dosya türü: {extension}",
        }

    try:
        if extension == ".pdf":
            return _process_pdf(file_path)
        else:
            return _process_image(file_path)

    except Exception as exc:
        return {
            "success": False,
            "text": "",
            "page_count": 0,
            "method": None,
            "error": f"Dosya işlenirken hata oluştu: {str(exc)}",
        }


def _process_pdf(file_path: str) -> dict:
    """PDF dosyasını işler: önce metin katmanına bakar, gerekirse OCR uygular."""
    extraction_result = extract_text_from_pdf(file_path)
    pages = extraction_result["pages"]
    ocr_needed_pages = extraction_result["ocr_needed_pages"]
    total_pages = extraction_result["total_pages"]

    used_ocr = False

    # Metin bulunamayan sayfalar için OCR uygula
    for page_number in ocr_needed_pages:
        image = convert_pdf_page_to_image(file_path, page_number)
        raw_text = run_ocr_on_image(image)
        pages[page_number] = clean_ocr_text(raw_text)
        used_ocr = True

    # Sayfaları sırayla birleştir
    ordered_texts = [pages[i] for i in range(total_pages)]
    full_text = "\n\n".join(text for text in ordered_texts if text)
    full_text = clean_ocr_text(full_text)

    if not full_text:
        return {
            "success": False,
            "text": "",
            "page_count": total_pages,
            "method": None,
            "error": "Belgeden metin çıkarılamadı (boş sonuç).",
        }

    if used_ocr and len(ocr_needed_pages) == total_pages:
        method = "ocr"
    elif used_ocr:
        method = "mixed"
    else:
        method = "pdf_text"

    return {
        "success": True,
        "text": full_text,
        "page_count": total_pages,
        "method": method,
        "error": None,
    }


def _process_image(file_path: str) -> dict:
    """JPG/PNG gibi görsel dosyaları işler: direkt OCR uygular."""
    image = Image.open(file_path)
    raw_text = run_ocr_on_image(image)
    cleaned_text = clean_ocr_text(raw_text)

    if not cleaned_text:
        return {
            "success": False,
            "text": "",
            "page_count": 1,
            "method": None,
            "error": "Görselden metin çıkarılamadı (boş sonuç).",
        }

    return {
        "success": True,
        "text": cleaned_text,
        "page_count": 1,
        "method": "ocr",
        "error": None,
    }