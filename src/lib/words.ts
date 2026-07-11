// Türkçe kelime havuzları — tüm kelimeler büyük harf (Türkçe karakterli).

/** Kelimle (Wordle) cevap havuzu: 5 harfli yaygın kelimeler. */
export const WORDS_5: string[] = [
  "KALEM", "KİTAP", "DENİZ", "ORMAN", "BULUT", "ÇİÇEK", "BAHÇE", "SOKAK", "ŞEHİR", "KÖPRÜ",
  "TAVAN", "DUVAR", "PERDE", "MASAL", "HAYAL", "KAVUN", "KİRAZ", "ELMAS", "ALTIN", "GÜMÜŞ",
  "BAKIR", "DEMİR", "KUMAŞ", "İPLİK", "DÜĞME", "CEKET", "KAZAK", "ÇORAP", "TARAK", "SABUN",
  "HAVLU", "KİLİM", "SEPET", "TABAK", "KAŞIK", "BIÇAK", "FIRIN", "SOFRA", "EKMEK", "REÇEL",
  "ŞEKER", "KAHVE", "LİMON", "SALÇA", "BİBER", "SOĞAN", "KABAK", "MARUL", "İNCİR", "BADEM",
  "CEVİZ", "SUSAM", "YOLCU", "VAPUR", "KAYIK", "MOTOR", "SARAY", "HİSAR", "KEMİK", "DAMAR",
  "YÜREK", "BEYİN", "DUDAK", "YANAK", "BİLEK", "TOPUK", "GÖLGE", "GÜNEŞ", "DÜNYA", "EVREN",
  "ZAMAN", "HAFTA", "BAHAR", "GÜZEL", "SICAK", "SOĞUK", "SERİN", "KURAK", "NEMLİ", "MUTLU",
  "ÜZGÜN", "KORKU", "CESUR", "BİLGE", "SADIK", "NAZİK", "KİBAR", "CİMRİ", "HIZLI", "YAVAŞ",
  "YAKIN", "GENİŞ", "DERİN", "KALIN", "HAFİF", "MÜZİK", "ŞARKI", "TÜRKÜ", "GİTAR", "KEMAN",
  "DAVUL", "ZURNA", "KAVAL", "SAHNE", "ROMAN", "FIKRA", "RESİM", "TABLO", "FIRÇA", "KALIP",
  "SINIF", "TAHTA", "SİLGİ", "ÇANTA", "YÜZME", "KOŞMA", "ATLET", "RAKET", "REKOR", "HEDEF",
  "KURAL", "SAYFA", "KAĞIT", "DOSYA", "KUTUP", "DALGA", "KÖPÜK", "YOSUN", "LİMAN", "FENER",
  "DÜMEN", "HALAT", "BALON", "ROKET", "MERAK", "BİLİM", "DENEY", "HÜCRE", "VİRÜS", "ŞİFRE",
  "ÇADIR", "DUMAN", "ASKER", "KILIÇ", "SAVAŞ", "BARIŞ", "ZAFER", "MADEN", "KÖMÜR", "YEŞİL",
  "PEMBE", "BEYAZ", "SİYAH", "KARGA", "SERÇE", "ŞAHİN", "YUNUS", "GEYİK", "ZEBRA", "PANDA",
];

/** Genel kelime havuzu (adam asmaca, kelime avı, anagram, kelime düellosu) */
export const WORD_POOL: string[] = [
  // 3-4 harf
  "SU", "EV", "GÖZ", "YOL", "DAĞ", "TAŞ", "KUŞ", "BAL", "GÜL", "KÖY",
  "TUZ", "BUZ", "KAR", "YAZ", "KIŞ", "GÜN", "SES", "SAZ", "TEL", "KOL",
  "BEL", "DİL", "DİŞ", "KAN", "TER", "CAN", "AŞK", "HAK", "SAÇ", "BAŞ",
  "AYI", "KUM", "ÇAY", "SÜT", "BAĞ", "GÖL", "ADA", "KAYA", "MASA", "KAPI",
  "YAZI", "KUZU", "KEDİ", "ARSA", "DERE", "TEPE", "ÇATI", "BACA", "SOBA", "HALI",
  "ELMA", "KİRA", "PARA", "ALTI", "YEDİ", "OTUZ", "KIRK", "GEMİ", "TREN", "YAYA",
  "KÖŞE", "PARK", "OKUL", "KALP", "AKIL", "RÜYA", "UYKU", "GECE", "ÖĞLE", "KURT",
  "FİL", "DEVE", "İNEK", "ATEŞ", "ODUN", "OYUN", "RENK", "MAVİ", "SARI", "MOR",
  "KUTU", "TOP", "ZAR", "PUAN", "OYA", "İPEK", "YÜN", "CAM", "KİL", "MUM",
  // 5 harf
  "KALEM", "KİTAP", "DENİZ", "ORMAN", "BULUT", "ÇİÇEK", "BAHÇE", "SOKAK", "ŞEHİR", "KÖPRÜ",
  "TAVAN", "DUVAR", "PERDE", "MASAL", "HAYAL", "KAVUN", "KİRAZ", "ELMAS", "ALTIN", "GÜMÜŞ",
  "BAKIR", "DEMİR", "KUMAŞ", "İPLİK", "DÜĞME", "CEKET", "KAZAK", "ÇORAP", "TARAK", "SABUN",
  "HAVLU", "KİLİM", "SEPET", "TABAK", "KAŞIK", "BIÇAK", "FIRIN", "SOFRA", "EKMEK", "REÇEL",
  "ŞEKER", "KAHVE", "LİMON", "SALÇA", "BİBER", "SOĞAN", "KABAK", "MARUL", "İNCİR", "BADEM",
  "CEVİZ", "SUSAM", "YOLCU", "VAPUR", "KAYIK", "MOTOR", "SARAY", "HİSAR", "KEMİK", "DAMAR",
  "YÜREK", "BEYİN", "DUDAK", "YANAK", "BİLEK", "TOPUK", "GÖLGE", "GÜNEŞ", "DÜNYA", "EVREN",
  "ZAMAN", "HAFTA", "BAHAR", "GÜZEL", "SICAK", "SOĞUK", "SERİN", "KURAK", "NEMLİ", "MUTLU",
  "ÜZGÜN", "KORKU", "CESUR", "BİLGE", "SADIK", "NAZİK", "KİBAR", "CİMRİ", "HIZLI", "YAVAŞ",
  "YAKIN", "GENİŞ", "DERİN", "KALIN", "HAFİF", "MÜZİK", "ŞARKI", "TÜRKÜ", "GİTAR", "KEMAN",
  "DAVUL", "ZURNA", "KAVAL", "SAHNE", "ROMAN", "FIKRA", "RESİM", "TABLO", "FIRÇA", "KALIP",
  "SINIF", "TAHTA", "SİLGİ", "ÇANTA", "YÜZME", "KOŞMA", "ATLET", "RAKET", "REKOR", "HEDEF",
  "KURAL", "SAYFA", "KAĞIT", "DOSYA", "KUTUP", "DALGA", "KÖPÜK", "YOSUN", "LİMAN", "FENER",
  "DÜMEN", "HALAT", "BALON", "ROKET", "MERAK", "BİLİM", "DENEY", "HÜCRE", "VİRÜS", "ŞİFRE",
  "ÇADIR", "DUMAN", "ASKER", "KILIÇ", "SAVAŞ", "BARIŞ", "ZAFER", "MADEN", "KÖMÜR", "YEŞİL",
  "PEMBE", "BEYAZ", "SİYAH", "KARGA", "SERÇE", "ŞAHİN", "YUNUS", "GEYİK", "ZEBRA", "PANDA",
  // 6+ harf
  "BİLGİSAYAR", "TELEFON", "PENCERE", "KELEBEK", "PAPATYA", "MENEKŞE", "KARANFİL",
  "PORTAKAL", "KARPUZ", "ÇİLEK", "VİŞNE", "KAYISI", "ŞEFTALİ", "PATLICAN", "DOMATES",
  "MAYDANOZ", "ISPANAK", "BROKOLİ", "İSTANBUL", "ANKARA", "İZMİR", "ANTALYA", "TRABZON",
  "KONYA", "ADANA", "BURSA", "ERZURUM", "SAMSUN", "MERSİN", "KAYSERİ", "ESKİŞEHİR",
  "ÖĞRETMEN", "DOKTOR", "MÜHENDİS", "AVUKAT", "HEMŞİRE", "POLİS", "MİMAR", "TERZİ",
  "MARANGOZ", "ÇİFTÇİ", "BALIKÇI", "MADENCİ", "PİLOT", "KAPTAN", "GARSON", "KASAP",
  "MANAV", "ECZACI", "GAZETECİ", "YAZAR", "RESSAM", "OYUNCU", "YÖNETMEN", "DANSÇI",
  "KIRLANGIÇ", "GÜVERCİN", "KARTAL", "BAYKUŞ", "PAPAĞAN", "PENGUEN", "AHTAPOT",
  "YENGEÇ", "KARİDES", "SİNCAP", "KİRPİ", "TAVŞAN", "CEYLAN", "KANGURU", "MAYMUN",
  "KAPLAN", "LEOPAR", "TİMSAH", "ŞİMŞEK", "KASIRGA", "DEPREM", "VOLKAN", "BUZUL",
  "IRMAK", "YAYLA", "PLATO", "KANYON", "MAĞARA", "OKYANUS", "GEZEGEN", "YILDIZ",
  "UZAYLI", "MEVSİM", "SONBAHAR", "İLKBAHAR", "RÜZGAR", "YAĞMUR", "TOPRAK", "ÇAMUR",
  "KUMSAL", "İSKELE", "YELKEN", "MERCAN", "MARTI", "SALYANGOZ",
  "KAPLICA", "ŞELALE", "KÖPRÜLÜ", "MEYDAN", "ÇARŞI", "PAZARYERİ", "MÜZE", "KÜTÜPHANE",
  "HASTANE", "ECZANE", "FABRİKA", "ATÖLYE", "GARAJ", "BALKON", "MERDİVEN", "ASANSÖR",
  "ANAHTAR", "KİLİT", "ZİNCİR", "MAKAS", "İĞNE", "YÜKSÜK", "NAKIŞ", "DANTEL",
  "YORGAN", "YASTIK", "BATTANİYE", "AYAKKABI", "TERLİK", "ŞAPKA", "ELDİVEN", "KEMER",
  "GÖMLEK", "PANTOLON", "ETEKLİK", "YELEK", "PALTO", "ŞEMSİYE", "GÖZLÜK", "KOLYE",
  "BİLEZİK", "YÜZÜK", "KÜPE", "SAAT", "TAKVİM", "HARİTA", "PUSULA", "DÜRBÜN",
  "MİKROSKOP", "TELESKOP", "BİSİKLET", "KAMYON", "OTOBÜS", "HELİKOPTER", "TRAMVAY",
  "FUTBOL", "BASKETBOL", "VOLEYBOL", "TENİS", "SATRANÇ", "HALTER", "GÜREŞ", "OKÇULUK",
];

const dedup = (arr: string[]) => [...new Set(arr)];

/** Adam asmaca için 5-10 harfli seçki */
export const HANGMAN_WORDS = dedup(WORD_POOL.filter((w) => w.length >= 5 && w.length <= 10));

/** Anagram için 4-7 harfli seçki */
export const ANAGRAM_WORDS = dedup(WORD_POOL.filter((w) => w.length >= 4 && w.length <= 7));

/** Kelime avı için 3-8 harf */
export const SEARCH_WORDS = dedup(WORD_POOL.filter((w) => w.length >= 3 && w.length <= 8));

const POOL_SET = new Set(WORD_POOL);
/** Kelime düellosunda geçerlilik kontrolü (havuzdaki yaygın kelimeler kabul edilir) */
export function isValidWord(w: string): boolean {
  return POOL_SET.has(w);
}
