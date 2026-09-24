# 🚀 ROADS-ON - .NET 8 & SQLITE CANLIYA ALMA VE YAYINLAMA REHBERİ

Bu proje, **Node.js gereksinimi olmadan** ve harici hiçbir veritabanı sunucusu (SQL Server / MySQL vb.) kurmaya gerek kalmadan, doğrudan **.NET 8 (ASP.NET Core)** ve **SQLite (`roadson.db`)** altyapısıyla çalışacak şekilde yapılandırılmıştır.

---

## ⚡ 1 DAKİKADA YAYINLAMA (PUBLISH) PAKETİ HAZIRLAMA

1. Proje ana klasöründeki **`publish.bat`** dosyasına çift tıklayın.
2. Komut tamamlandığında **`publish/`** klasörü sunucunuza yüklenmeye hazır hale gelir.

---

## 🌐 SUNUCUDA ÇALIŞTIRMA SEÇENEKLERİ

### SEÇENEK 1: Windows Server / IIS (En Yaygın & Pratik Yöntem)

Eğer sunucunuz standart bir Windows Server veya Plesk Windows hosting ise:

1. Sunucunuzda **.NET 8 Hosting Bundle** yüklü olduğundan emin olun ([Microsoft Resmi İndirme Linki](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)).
2. `publish/` klasörünün içindeki tüm dosyaları IIS üzerinde sitenizin kök dizinine (örn: `C:\inetpub\wwwroot\roadson` veya Plesk `httpdocs`) kopyalayın.
3. IIS'te Application Pool (Uygulama Havuzu) ayarlarında:
   - **.NET CLR Sürümü:** `Yönetilen Kod Yok` (No Managed Code)
4. Klasör içerisindeki `web.config` dosyası IIS tarafından otomatik olarak tanınacak ve siteniz anında yayına girecektir.
5. **Önemli:** IIS kullanıcısına (`IIS_IUSRS` veya `IUSR`) `data` klasörü üzerinde **Yazma (Write)** izni verin (SQLite veritabanı yazabilmesi için).

---

### SEÇENEK 2: Doğrudan Windows Servisi veya Konsol Olarak (.exe)

Eğer sunucunuzda uzak masaüstü (RDP) erişiminiz varsa:

1. `publish/` klasörünü sunucunuzda istediğiniz bir dizine taşıyın (örn: `C:\RoadsOn`).
2. Klasör içindeki **`RoadsOn.exe`** dosyasına çift tıklayarak çalıştırın.
3. Uygulama varsayılan olarak `http://localhost:5000` (veya `appsettings.json` / ortam değişkeninde belirlediğiniz portta) yayına başlar.
4. Arka planda 7/24 kesintisiz çalışması için Windows Servisi olarak kaydetmek isterseniz:
   ```cmd
   sc create RoadsOn binPath="C:\RoadsOn\RoadsOn.exe" start=auto
   sc start RoadsOn
   ```

---

### SEÇENEK 3: Linux VPS / Docker (Gerekirse)

Eğer ileride Linux sunucuya geçmek isterseniz:
```bash
cd /var/www/roadson
dotnet RoadsOn.dll
```
Systemd servisi veya Nginx ters vekili arkasında doğrudan çalışır.

---

## 🔐 ADMİN PANELİ BİLGİLERİ

- **Admin Paneli Giriş URL:** `http://siteadiniz.com/admin` veya `http://siteadiniz.com/admin/login`
- **Varsayılan Kullanıcı Adı:** `admin`
- **Varsayılan Şifre:** `RoadsOn2026!`

*(Panele giriş yaptıktan sonra üst menüdeki "Şifre Değiştir" butonuyla şifrenizi istediğiniz an güncelleyebilirsiniz. Şifreler BCrypt ile güvenli biçimde hashlenir.)*

---

## 📂 VERİTABANI YEDEĞİ & TAŞIMA (SQLITE)

- Verileriniz tek bir dosya halinde **`data/roadson.db`** içinde tutulur.
- Yedek almak için tek yapmanız gereken bu dosyayı kopyalamaktır.
- Taşıma yaparken de yalnızca bu dosyayı yeni sunucudaki `data/` klasörüne kopyalamanız yeterlidir.
