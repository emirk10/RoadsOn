using System.Data;
using Dapper;
using Microsoft.Data.Sqlite;
using RoadsOn.Models;

namespace RoadsOn.Services;

public class DatabaseService
{
    private readonly string _connectionString;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;
    private readonly ILogger<DatabaseService> _logger;

    public DatabaseService(IConfiguration configuration, IWebHostEnvironment env, ILogger<DatabaseService> logger)
    {
        _configuration = configuration;
        _env = env;
        _logger = logger;

        Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

        var configuredConn = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrEmpty(configuredConn) && configuredConn.Contains("Data Source="))
        {
            var rawPath = configuredConn.Replace("Data Source=", "").Trim();
            var absoluteDbPath = Path.IsPathRooted(rawPath) ? rawPath : Path.Combine(env.ContentRootPath, rawPath);
            _connectionString = $"Data Source={absoluteDbPath}";
        }
        else
        {
            var defaultDbPath = Path.Combine(env.ContentRootPath, "data", "roadson.db");
            _connectionString = $"Data Source={defaultDbPath}";
        }
    }

    public IDbConnection CreateConnection()
    {
        return new SqliteConnection(_connectionString);
    }

    public void InitializeDatabase()
    {
        try
        {
            // Ensure data directory exists
            var dataDir = Path.Combine(_env.ContentRootPath, "data");
            if (!Directory.Exists(dataDir))
            {
                Directory.CreateDirectory(dataDir);
            }

            using var connection = CreateConnection();
            connection.Open();

            // 1. Create or update admin_users table
            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'worker',
                    is_active INTEGER DEFAULT 1,
                    full_name TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ");

            // Migration for existing databases
            try { connection.Execute("ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'worker';"); } catch { }
            try { connection.Execute("ALTER TABLE admin_users ADD COLUMN is_active INTEGER DEFAULT 1;"); } catch { }
            try { connection.Execute("ALTER TABLE admin_users ADD COLUMN full_name TEXT;"); } catch { }
            try { connection.Execute("ALTER TABLE admin_users ADD COLUMN created_at DATETIME;"); } catch { }

            // Migration for documents table
            try { connection.Execute("ALTER TABLE documents ADD COLUMN shipping_scope TEXT DEFAULT 'yurtici';"); } catch { }
            try { connection.Execute("ALTER TABLE documents ADD COLUMN is_paid INTEGER DEFAULT 0;"); } catch { }

            // 2. Create documents table
            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS documents (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    doc_number TEXT UNIQUE NOT NULL,
                    doc_date TEXT NOT NULL,
                    company_name TEXT NOT NULL,
                    from_location TEXT,
                    to_location TEXT,
                    plate_number TEXT,
                    driver_info TEXT,
                    price REAL DEFAULT 0,
                    currency TEXT DEFAULT 'TRY',
                    invoice_info TEXT,
                    shipping_scope TEXT DEFAULT 'yurtici',
                    is_paid INTEGER DEFAULT 0,
                    custom_fields_json TEXT DEFAULT '[]',
                    notes TEXT,
                    print_count INTEGER DEFAULT 0,
                    last_printed_at DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ");

            // 3. Create contacts (business partners & map cargo) table
            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS contacts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    company_name TEXT,
                    phone TEXT,
                    email TEXT,
                    from_location TEXT,
                    to_location TEXT,
                    cargo_type TEXT,
                    plate_number TEXT,
                    latitude REAL,
                    longitude REAL,
                    location_name TEXT,
                    notes TEXT,
                    status TEXT DEFAULT 'active',
                    avatar_color TEXT DEFAULT '#FF6500',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ");

            // Create indexes for performance
            connection.Execute(@"
                CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_name);
                CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(doc_date);
                CREATE INDEX IF NOT EXISTS idx_documents_scope ON documents(shipping_scope);
                CREATE INDEX IF NOT EXISTS idx_documents_paid ON documents(is_paid);
                CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
                CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
            ");

            // 4. Seed default admin user if not exists, and ensure admin role
            var defaultUser = _configuration["AdminSettings:DefaultUsername"] ?? "admin";
            var defaultPass = _configuration["AdminSettings:DefaultPassword"] ?? "RoadsOn2026!";

            var existingUser = connection.QueryFirstOrDefault<AdminUser>(
                "SELECT id, username FROM admin_users WHERE username = @Username",
                new { Username = defaultUser }
            );

            if (existingUser == null)
            {
                var hash = BCrypt.Net.BCrypt.HashPassword(defaultPass);
                connection.Execute(
                    "INSERT INTO admin_users (username, password_hash, role, is_active, full_name) VALUES (@Username, @Hash, 'admin', 1, 'Sistem Yöneticisi')",
                    new { Username = defaultUser, Hash = hash }
                );
                _logger.LogInformation("Default admin user initialized: {Username}", defaultUser);
            }
            else
            {
                // Ensure existing seeded user is admin & active
                connection.Execute(
                    "UPDATE admin_users SET role = 'admin', is_active = 1 WHERE username = @Username",
                    new { Username = defaultUser }
                );
            }

            // 5. Seed sample business contacts for map demo if empty
            var contactCount = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM contacts");
            if (contactCount == 0)
            {
                connection.Execute(@"
                    INSERT INTO contacts (name, company_name, phone, email, from_location, to_location, cargo_type, plate_number, latitude, longitude, location_name, notes, status, avatar_color)
                    VALUES 
                    ('Ahmet Yılmaz', 'Yılmaz Global Lojistik', '+90 532 111 2233', 'ahmet@yilmazloj.com', 'İstanbul (Ambarlı)', 'Münih / Almanya', 'Tekstil & Konfeksiyon', '34 RO 1923 / 34 DR 01', 41.0082, 28.9784, 'İstanbul, Türkiye', 'Gümrük işlemleri Kapıkule sınırında tamamlandı. Salı günü teslimat planlandı.', 'transit', '#FF6500'),
                    ('Klaus Schneider', 'Bavaria Cargo GmbH', '+49 170 555 4422', 'klaus@bavariacargo.de', 'Frankfurt / Almanya', 'Milano / İtalya', 'Endüstriyel Makine Parçaları', 'M-BC 8820', 50.1109, 8.6821, 'Frankfurt, Almanya', 'Haftalık düzenli palet sevkiyatı yapılıyor. Ödeme vadesi 30 gün.', 'active', '#10b981'),
                    ('Elmir Qasimov', 'Hazar Trans Dış Ticaret', '+994 50 234 5678', 'elmir@hazartrans.az', 'Bakü Limanı', 'Tiflis / Gürcistan', 'Petrol Türevleri & Plastik Ham Madde', '10-AZ-990', 40.4093, 49.8671, 'Bakü, Azerbaycan', 'Güvenilir iş ortağı. Özel korumalı dorse tahsis edildi.', 'active', '#3b82f6'),
                    ('Murat Demir', 'Demirler Ağır Nakliyat', '+90 544 333 4455', 'murat@demirler.com', 'İzmir (Alsancak)', 'Trieste Limanı (Ro-Ro)', 'Zeytinyağı & Kuru Gıda', '35 DEM 88', 38.4237, 27.1428, 'İzmir, Türkiye', 'Pendik Ro-Ro gemisine yüklendi, varış perşembe.', 'transit', '#8b5cf6');
                ");
                _logger.LogInformation("Sample contacts seeded for world map.");
            }

            _logger.LogInformation("SQLite database initialized successfully at: {ConnectionString}", _connectionString);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize SQLite database.");
            throw;
        }
    }

    public string GenerateNextDocNumber()
    {
        using var connection = CreateConnection();
        var currentYear = DateTime.Now.Year;
        var prefix = $"RO-{currentYear}-";

        var lastDocNumber = connection.QueryFirstOrDefault<string>(
            "SELECT doc_number FROM documents WHERE doc_number LIKE @Prefix ORDER BY id DESC LIMIT 1",
            new { Prefix = $"{prefix}%" }
        );

        var nextSeq = 1;
        if (!string.IsNullOrEmpty(lastDocNumber))
        {
            var parts = lastDocNumber.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var seq))
            {
                nextSeq = seq + 1;
            }
        }

        return $"{prefix}{nextSeq:D4}";
    }
}
