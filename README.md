# 🎮 Splend Game — Premium Bulmaca Oyun Portalı

**Splend Game**, modern arayüz tasarımı (SaaS/AAA) ve gelişmiş özellikleri bir araya getiren web tabanlı bir zeka ve bulmaca oyunları platformudur. 30'dan fazla tek kişilik ve gerçek zamanlı çok oyunculu oyunu tek bir çatı altında sunar.

Arayüz dili ve tasarımı; **Vercel, Linear, Apple ve Steam** çizgilerinden esinlenilerek, tamamen minimalist, yumuşak glassmorphism efektleri, modern tipografi (Outfit) ve akıcı animasyonlar (Framer Motion) ile donatılmıştır.

---

## ✨ Özellikler

* **30+ Bulmaca Oyunu:**
  * **Tek Kişilik (20 adet):** Sudoku, 2048, Mayın Tarlası, Hafıza Kartları, Kelime Avı, Adam Asmaca, Simon Der Ki, Nonogram, Matematik Koşusu, Hanoi Kuleleri, Yılan ve daha fazlası.
  * **Çok Oyunculu (10 adet):** XOX, Dörtlü Dizi, Noktalar ve Kutular, Amiral Battı, Reversi, Dama, Kelime Düellosu, Hafıza Düellosu, Nim ve Beş Taş (Gomoku).
* **Gerçek Zamanlı Multiplayer Ağı:** Custom `MatchShell.tsx` yapısı üzerinden Firestore entegrasyonuyla odalar kurulabilir, anlık durumlar senkronize edilir ve oyun kazananı global verilere işlenir.
* **Modern Oyuncu Paneli (My Games Dashboard):**
  * Steam & Discord esintili profil görünümü.
  * Seviye, XP ve kazanma oranı istatistikleri.
  * Gerçek zamanlı Firestore dinleyicileriyle aktif odaları ve geçmiş oyunları listeleme.
  * **Tek Tıkla Bağlan (Auto-Rejoin):** URL üzerinden `?code=CODE` parametresini okuyarak odaya anında otomatik bağlanma.
  * **Geçmiş Odalar (Local Storage Fallback):** Çevrimdışı durumlarda veya misafir modunda girilen son 10 odayı tarayıcıda saklama.
* **Global Skor Tablosu:**
  * Global ve oyuna göre filtrelenebilir podium (ilk 3) ve detaylı sıralama listesi.
* **Emojisiz Premium UI:** Arayüzdeki tüm emojiler kaldırılarak Lucide React kütüphanesinin uniform SVG ikonlarıyla yeniden yapılandırılmıştır.

---

## 🛠️ Teknoloji Yığını

* **Framework:** Next.js (App Router, Turbopack)
* **Arayüz Tasarımı:** Tailwind CSS v4 & Vanilla CSS
* **Animasyonlar:** Framer Motion
* **İkonlar:** Lucide React
* **Veritabanı & Kimlik Doğrulama:** Firebase (Auth, Firestore)
* **Geliştirme Dili:** TypeScript (Strict Type-Safety)

---

## 🚀 Başlangıç

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/gorkemAlpaslan/SplendGame.git
cd SplendGame
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Çevre Değişkenlerini Yapılandırın
Kök dizinde `.env.local` dosyası oluşturun ve Firebase API anahtarlarınızı bağlayın:
```env
FIREBASE_API_KEY=YOUR_API_KEY
FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_APP_ID
```

> **Not:** Bu değişkenler `NEXT_PUBLIC_` öneki **taşımaz** — yalnızca sunucu tarafında okunurlar ve asla istemci bundle'ına eklenmezler. Vercel'de *Environment Variables* paneline direkt olarak ekleyebilirsin.
*(Değer şablonu için `.env.local.example` dosyasına göz atabilirsiniz.)*

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```
Ardından tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açarak oynamaya başlayın!

---

## 📦 Dağıtım & Derleme

Üretim sürümünü derlemek için aşağıdaki komutu kullanın:
```bash
npm run build
```
Next.js statik ve dinamik sayfaları optimize ederek Turbopack derlemesini tamamlayacaktır.