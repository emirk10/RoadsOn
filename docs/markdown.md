# ROADS-ON WEB SİTESİ İÇERİK VE YAPI DOKÜMANI (CONTENT SPECIFICATION)

Bu doküman; Roads-on (Hava, Kara, Deniz Taşımacılığı ve Gümrükleme) kurumsal tanıtım sitesinin tüm sayfa mimarisini, metinlerini, görsel yerleşimlerini ve bileşen hiyerarşisini içerir. Sitede form veya kullanıcı etkileşimi bulunmamakta; doğrudan kurumsal bilgilendirme, prestij ve kurumsal iletişim kanalları hedeflenmektedir.

---

## 1. GENEL TASARIM & MARKA DİLİ (GLOBAL ASSETS)

*   **Marka İsmi:** Roads-on
*   **Slogan:** Küresel Ticaretin Güvenli Rotası
*   **Renk Paleti:**
    *   Birincil (Primary): Lacivert / Koyu Gece Mavisi (`#0B192C` veya `#1E3E62`)
    *   Vurgu (Accent): Endüstriyel Turuncu / Kehribar (`#FF6500` veya `#E85C0D`)
    *   Nötrler: Açık Gri Zemin (`#F5F7F8`), Beyaz (`#FFFFFF`), Koyu Metin (`#222831`)
*   **Font Ailesi:** Inter, Plus Jakarta Sans veya Montserrat

---

## 2. HEADER & NAVİGASYON (TÜM SAYFALARDA ORTAK)

### Bileşen Yapısı
*   **Sol:** `[Roads-on Logo]` (Vektörel logo + "Global Logistics & Customs" alt ibaresi)
*   **Orta Menü:**
    *   Ana Sayfa (`/` veya `#hero`)
    *   Hizmetlerimiz (`#hizmetler`)
        *   Karayolu Taşımacılığı
        *   Havayolu Taşımacılığı
        *   Denizyolu Taşımacılığı
        *   Gümrükleme & Antrepo
        *   Multimodal Çözümler
    *   Kurumsal (`#kurumsal`)
    *   Operasyon Portföyü (`#portfoy`)
    *   İletişim (`/iletisim` veya `#iletisim`)
*   **Sağ Alan:**
    *   Dil Seçimi: `[TR | EN]`
    *   CTA Butonu: `[Bize Ulaşın]` (İletişim sayfasına/bölümüne yönlendirir)

---

## 3. SAYFA 1: ANA SAYFA (`index.html`)

### BÖLÜM 1: HERO SECTION (MANŞET ALANI)
*   **Arka Plan Görseli:** `assets/img/hero-logistics-hub.jpg` (Liman, tır ve kargo uçağının modern kompozisyonu; koyu degrade kaplama)
*   **Üst Rozet (Badge):** `● ENTEGRE HAVA • KARA • DENİZ • GÜMRÜKLEME ÇÖZÜMLERİ`
*   **Ana Başlık (H1):** Küresel Ticarete Kesintisiz ve Güvenli Rota
*   **Alt Açıklama (Lead Paragraph):** Karayolu, denizyolu, havayolu ve gümrük süreçlerini tek çatı altında birleştiren entegre operasyon modeliyle tedarik zincirinizde gecikmeleri önlüyor, yükünüzü güvenle hedefine ulaştırıyoruz.
*   **Aksiyon Butonları:**
    *   Buton 1 (Primary): `[Hizmetlerimizi İncele]` -> Hedef: `#hizmetler`
    *   Buton 2 (Secondary Outline): `[Doğrudan İletişim]` -> Hedef: `/iletisim`
*   **Öne Çıkan Bilgi Kartı (Floating Badge):**
    *   *Başlık:* Uçtan Uca Operasyon Güvencesi
    *   *Metin:* Çıkış noktasındaki gümrüklemeden varış kapısına kadar tek muhatap, kesintisiz takip ve tam şeffaflık.

---

### BÖLÜM 2: STRATEJİK HİZMET ALANLARI (3'LÜ KART BLOKLARI)
*Şablonun 3'lü gelişme/inovasyon kartı yapısı.*

*   **Kart 1:**
    *   *Görsel:* `assets/img/card-multimodal.jpg` (Liman-demiryolu-tır aktarma sahası)
    *   *Kategori:* Kombine & Multimodal
    *   *Başlık:* Maliyet ve Süre Odaklı Çok Modlu Taşımacılık
    *   *Açıklama:* Yükün aciliyetine ve yapısına göre hava, kara ve denizyolu hatlarını optimize ederek en ideal transit süreyi ve navlun dengesini kuruyoruz.
*   **Kart 2:**
    *   *Görsel:* `assets/img/card-customs.jpg` (Gümrük evrak kontrolü ve operasyon masası)
    *   *Kategori:* Gümrük Müşavirliği & Mevzuat
    *   *Başlık:* Sıfır Hata Politikasıyla Hızlı Gümrükleme
    *   *Açıklama:* Doğru GTİP tespiti ve mevzuat uzmanlığı ile ithalat, ihracat ve transit işlemlerinde ardiye/demuraj risklerini ortadan kaldırıyoruz.
*   **Kart 3:**
    *   *Görsel:* `assets/img/card-project-cargo.jpg` (Ağır sanayi ekipmanı veya lowbed tır taşımacılığı)
    *   *Kategori:* Özel Operasyonlar
    *   *Başlık:* Proje ve Gabari Dışı Ağır Yük Taşımacılığı
    *   *Açıklama:* Standart dışı ölçü ve tonajdaki endüstriyel yükler için özel ekipman, yol etüdü ve eskort izinleriyle planlı lojistik yönetimi.

---

### BÖLÜM 3: KURUMSAL KİMLİK (VİZYON & MİSYON)
*   **Üst Başlık:** `KURUMSAL YAKLAŞIM`
*   **Ana Başlık (H2):** Küresel Tedarik Zincirine Güç Katıyoruz
*   **Açıklama:** Dış ticaretin dinamik yapısında müşterilerimize sadece bir taşıyıcı değil, operasyonel yüklerini hafifleten stratejik bir çözüm ortağı olarak hizmet veriyoruz.
*   **01 VİZYONUMUZ (Numaralı Kart):** Küresel acente ağımızı ve operasyonel altyapımızı sürekli geliştirerek; multimodal taşımacılık ve gümrükleme alanında bölgenin en güvenilir, şeffaf ve çevik lojistik markası olmak.
*   **02 MİSYONUMUZ (Numaralı Kart):** Taşımacılık ve gümrükleme zincirindeki bürokratik ve operasyonel engelleri ortadan kaldırıp; doğru rota, şeffaf süreç ve tam zamanında teslimat ilkeleriyle iş ortaklarımızın rekabet gücünü artırmak.

---

### BÖLÜM 4: HAKKIMIZDA & GÜVEN GÖSTERGELERİ (ABOUT & HIGHLIGHTS)
*   **Sol Kolon Görsel:** `assets/img/about-team-operations.jpg` (Lojistik operasyon merkezi ve küresel rota haritası)
*   **Sağ Kolon İçerik:**
    *   *Etiket:* BİZ KİMİZ?
    *   *Başlık (H2):* Tedarik Zincirinizin En Güçlü ve Öngörülebilir Halkası
    *   *Paragraf:* Roads-on; uluslararası ticaret yapan firmaların lojistik ve gümrük süreçlerinde karşılaştığı operasyonel belirsizlikleri ve maliyet risklerini ortadan kaldırmak amacıyla kuruldu. Hava, kara ve denizyolu hatlarındaki güçlü bağlantılarımızı yetkin gümrük müşavirliği tecrübemizle birleştiriyor; yükünüzü dünyanın her noktasına aynı titizlikle ulaştırıyoruz.
*   **4 Temel Güven Rozeti (Grid Blok):**
    1.  **Güçlü Global Acente Ağı:** Dünyanın ana ticaret limanlarında ve merkezlerinde yerel operasyonel kabiliyet.
    2.  **Yüksek Zamanında Teslimat Başarısı:** Dinamik rota planlaması, kesintisiz takip ve proaktif risk yönetimi.
    3.  **Uçtan Uca Şeffaf Süreç:** Yükleme anından teslimata kadar her adımda açık ve net operasyonel bilgilendirme.
    4.  **Uluslararası Kalite Standartları:** Taşımacılık ve mevzuat prosedürlerinde uluslararası emniyet ve kalite kriterlerine tam uyum.

---

### BÖLÜM 5: KALİTE & GÜVENCE POLİTİKAMIZ (3 SÜTUNLU BLOK)
*   **01. Proaktif Risk ve Rota Yönetimi:** Olası hava muhalefeti, sınır yoğunluğu veya mevzuat güncellemelerini önceden analiz eder, alternatif planları anında devreye alırız.
*   **02. Şeffaf ve Sürprizsiz Maliyet:** Beklenmeyen ek masraflar olmadan, operasyon öncesinde netleştirilen maliyet tabloları ve dürüst fiyatlandırma politikası uygularız.
*   **03. Tek Operasyon Sorumlusu:** Taşıma, gümrük, depolama ve evrak süreçlerinizin tümü için tek bir uzman temsilci ile doğrudan ve hızlı iletişim sağlarsınız.

---

### BÖLÜM 6: HİZMET VE OPERASYON PORTFÖYÜ (İKİ KOLONLU TABLO/LİSTE)
*Şablonun İmalat & Revizyon portföy tablosu yapısı.*

#### KOLON A: TAŞIMACILIK ÇÖZÜMLERİMİZ
*   **Karayolu Taşımacılığı:** Komple (FTL) ve Parsiyel (LTL) düzenli seferler, kapıdan kapıya teslimat, ekspres minivan lojistiği.
*   **Havayolu Taşımacılığı:** IATA standartlarında kargo, acil yedek parça taşımaları, havalimanından havalimanına hızlı transfer.
*   **Denizyolu Taşımacılığı:** FCL (Tam Konteyner) ve LCL (Parsiyel Konteyner) hatları, özel ekipman (Open Top, Flat Rack, Reefer) yönetimi.
*   **Multimodal Taşımacılık:** Deniz + Kara veya Hava + Kara kombinasyonlarıyla dengelenmiş hız ve bütçe planlaması.
*   **Isı Kontrollü (Frigo) Taşıma:** Soğuk zincir gıda, ilaç ve kimyasal ürünler için sıcaklık takip sistemli güvenli filo.

#### KOLON B: GÜMRÜKLEME VE ENTEGRE HİZMETLER
*   **İthalat & İhracat Gümrük Müşavirliği:** Tüm gümrük müdürlüklerinde hızlı beyanname yazımı, tarife tespiti ve evrak tescili.
*   **GTİP ve Mevzuat Danışmanlığı:** Gümrük Tarife İstatistik Pozisyonu analiziyle vergi risklerinin ve gecikmelerin önlenmesi.
*   **Transit & Serbest Bölge İşlemleri:** Antrepo, serbest bölge giriş-çıkış ve aktarma rejimlerinin eksiksiz idaresi.
*   **Gümrüklü Antrepo & Serbest Depolama:** Güvenli stoklama, elleçleme, barkodlama ve paletleme hizmetleri.
*   **Emtia & Nakliyat Sigortası:** Taşınan tüm yüklerin taşıma modları boyunca all-risk teminat altına alınması.

---

### BÖLÜM 7: SAHA & OPERASYON GALERİSİ (GRID GALERİ)
*   **Görsel 1:** `assets/img/gallery-port-crane.jpg` -> *Liman Konteyner Elleçleme ve Gemi Yükleme Operasyonları*
*   **Görsel 2:** `assets/img/gallery-air-cargo.jpg` -> *Havalimanı Kargo Paletleme ve Geniş Gövde Yükleme*
*   **Görsel 3:** `assets/img/gallery-fleet-trucks.jpg` -> *Uluslararası Karayolu Filosu ve Lojistik Aktarma Merkezi*
*   **Görsel 4:** `assets/img/gallery-warehouse-racks.jpg` -> *Yüksek Tavanlı Güvenli Antrepo ve Depolama Alanı*
*   **Görsel 5:** `assets/img/gallery-customs-desk.jpg` -> *Gümrük Saha Operasyon ve Dijital Evrak Tescil Masası*

---

## 4. SAYFA 2: İLETİŞİM SAYFASI (`iletisim.html`)

*(Form içermeyen, tamamen doğrudan iletişim kanalları ve kurumsal adres odaklı sayfa)*

### BÖLÜM 1: İLETİŞİM BAŞLIĞI & GİRİŞ
*   **Başlık (H1):** İletişim & Operasyon Masası
*   **Alt Başlık:** Taşımacılık talepleriniz, gümrük danışmanlığı ve operasyonel süreçler için merkez ofisimiz ve ilgili departmanlarımızla doğrudan iletişime geçebilirsiniz.

---

### BÖLÜM 2: KURUMSAL İLETİŞİM VE DEPARTMAN KARTLARI (3 SÜTUNLU BLOK)

*   **Kart 1: Doğrudan Telefon & Santral**
    *   *Merkez Santral:* `+90 (212) 000 00 00`
    *   *Operasyon & Navlun Destek:* `+90 (212) 000 00 01`
    *   *Faks:* `+90 (212) 000 00 02`
    *   *Çalışma Saatleri:* Pazartesi - Cuma: 08:30 - 18:00
*   **Kart 2: Departman E-Posta Kanalları**
    *   *Genel & Kurumsal İletişim:* `info@roads-on.com`
    *   *Taşımacılık & Fiyatlandırma Masası:* `operasyon@roads-on.com`
    *   *Gümrük Müşavirliği & Mevzuat Masası:* `gumruk@roads-on.com`
*   **Kart 3: Genel Merkez & Operasyon Lokasyonları**
    *   *Genel Merkez:* [Şirketin Resmi Adresi / İstanbul, Türkiye]
    *   *Liman İrtibat Masası:* Ambarlı Liman Tesisleri / İstanbul
    *   *Havalimanı Kargo İrtibat:* İGA Kargo Terminali / İstanbul

---

### BÖLÜM 3: OFİS VE HARİTA BÖLÜMÜ
*   **Harita Bileşeni:** Genel Merkezin fiziksel konumunu gösteren Google Maps interaktif harita çerçevesi.
*   **Ziyaret Bilgilendirme Notu:** *"Merkez ofisimizde misafirlerimizi ağırlamaktan memnuniyet duyarız. Operasyonel toplantılar ve yüz yüze gümrük danışmanlığı randevuları için lütfen önceden irtibata geçiniz."*

---

## 5. FOOTER (ALT BİLGİ ALANI - TÜM SAYFALARDA ORTAK)

### Bileşen Yapısı
*   **Sütun 1 (Marka & Özet):**
    *   Logo: `Roads-on`
    *   Metin: Karayolu, havayolu, denizyolu ve gümrükleme alanında küresel standartlarda entegre lojistik çözümleri.
    *   Slogan: *“Güvenli Rota, Zamanında Teslimat.”*
*   **Sütun 2 (Hızlı Menü):**
    *   Ana Sayfa
    *   Kurumsal Kimlik
    *   Hizmetlerimiz
    *   Operasyon Portföyü
    *   İletişim
*   **Sütun 3 (Hizmet Alanları):**
    *   Karayolu Taşımacılığı
    *   Denizyolu Konteyner
    *   Havayolu Ekspres Kargo
    *   Gümrük Müşavirliği
    *   Gümrüklü Antrepo & Depolama
*   **Sütun 4 (İletişim & Lokasyon):**
    *   Santral: `+90 (212) 000 00 00`
    *   E-Posta: `info@roads-on.com`
    *   Konum: İstanbul, Türkiye
*   **Alt Çizgi (Sub-Footer):**
    *   Sol: `© 2026 Roads-on Lojistik & Gümrükleme Hizmetleri. Tüm hakları saklıdır.`
    *   Sağ: `[Gizlilik Bildirimi]`

---

## 6. GÖRSEL YER TUTUCU (PLACEHOLDER) LİSTESİ

| Dosya Adı | Konum | Görsel İçeriği / Teması |
| :--- | :--- | :--- |
| `hero-logistics-hub.jpg` | Ana Sayfa - Hero | Liman, uçak ve tırın yer aldığı geniş açı görsel |
| `card-multimodal.jpg` | Ana Sayfa - Öne Çıkanlar | Konteyner terminali ve aktarma sahası |
| `card-customs.jpg` | Ana Sayfa - Öne Çıkanlar | Gümrük evrak onay ve operasyon masası |
| `card-project-cargo.jpg` | Ana Sayfa - Öne Çıkanlar | Ağır nakliyat, gabari dışı tır operasyonu |
| `about-team-operations.jpg`| Ana Sayfa - Hakkımızda | Lojistik operasyon merkezi ve küresel harita |
| `gallery-port-crane.jpg` | Ana Sayfa - Galeri | Konteyner gemisi ve vinç yüklemesi |
| `gallery-air-cargo.jpg` | Ana Sayfa - Galeri | Kargo uçağı yükleme bandı ve paletler |
| `gallery-fleet-trucks.jpg` | Ana Sayfa - Galeri | Modern tır filosu ve otoyol lojistiği |
| `gallery-warehouse-racks.jpg`| Ana Sayfa - Galeri | Modern yüksek tavanlı antrepo ve forklift |
| `gallery-customs-desk.jpg` | Ana Sayfa - Galeri | Resmi gümrükleme ve belge tescil süreci |