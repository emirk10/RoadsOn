using System.Security.Claims;
using System.Text.Json;
using Dapper;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using Dapper;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.FileProviders;
using RoadsOn.Models;
using RoadsOn.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure listening URLs / Port
// Checks PORT env variable (e.g. from cloud/hosting) or ASPNETCORE_URLS
var portEnv = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(portEnv) && int.TryParse(portEnv, out var customPort))
{
    builder.WebHost.UseUrls($"http://*:{customPort}");
}

// Add services
builder.Services.AddSingleton<DatabaseService>();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "roadson_auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromDays(1);
        options.SlidingExpiration = true;
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return context.Response.WriteAsJsonAsync(new { error = "Oturum açmanız gerekiyor." });
            }
            context.Response.Redirect("/admin/login");
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddAntiforgery();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LoginLimiter", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(new { error = "Çok fazla giriş denemesi yaptınız. Lütfen 1 dakika bekleyip tekrar deneyin." }, cancellationToken: token);
    };
});

var app = builder.Build();

app.UseHttpsRedirection();
app.UseRateLimiter();

// Initialize SQLite database
var dbService = app.Services.GetRequiredService<DatabaseService>();
dbService.InitializeDatabase();

app.UseAuthentication();
app.UseAuthorization();

// 1. Static Assets Configuration
var contentRoot = app.Environment.ContentRootPath;

// Serve /assets
var assetsPath = Path.Combine(contentRoot, "assets");
if (Directory.Exists(assetsPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(assetsPath),
        RequestPath = "/assets"
    });
}

// Serve /admin/assets
var adminAssetsPath = Path.Combine(contentRoot, "admin", "assets");
if (Directory.Exists(adminAssetsPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(adminAssetsPath),
        RequestPath = "/admin/assets"
    });
}

// Helper function to serve HTML file
IResult ServeHtml(string relativePath)
{
    var fullPath = Path.Combine(contentRoot, relativePath);
    if (!File.Exists(fullPath)) return Results.NotFound();
    return Results.File(fullPath, "text/html; charset=utf-8");
}

// Helper to check user authentication
bool IsUserAuthenticated(HttpContext http, out int userId, out string username)
{
    userId = 0;
    username = string.Empty;
    if (http.User.Identity?.IsAuthenticated == true)
    {
        var idStr = http.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(idStr, out userId);
        username = http.User.Identity.Name ?? string.Empty;
        return true;
    }
    return false;
}

string GetUserRole(HttpContext http)
{
    return http.User.FindFirst(ClaimTypes.Role)?.Value ?? "worker";
}

bool IsAdmin(HttpContext http)
{
    return http.User.Identity?.IsAuthenticated == true && 
           (GetUserRole(http) == "admin" || http.User.IsInRole("admin"));
}

// 2. Web Page Routes
app.MapGet("/", () => ServeHtml("index.html"));
app.MapGet("/index.html", () => ServeHtml("index.html"));
app.MapGet("/iletisim", () => ServeHtml("iletisim.html"));
app.MapGet("/iletisim.html", () => ServeHtml("iletisim.html"));

// Admin routes with auth guarding
app.MapGet("/admin/login", (HttpContext http) =>
{
    if (IsUserAuthenticated(http, out _, out _))
    {
        return Results.Redirect("/admin");
    }
    return ServeHtml("admin/login.html");
});

app.MapGet("/admin", (HttpContext http) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Redirect("/admin/login");
    }
    return ServeHtml("admin/index.html");
});

app.MapGet("/admin/index.html", (HttpContext http) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Redirect("/admin/login");
    }
    return ServeHtml("admin/index.html");
});

app.MapGet("/admin/print", (HttpContext http) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Redirect("/admin/login");
    }
    return ServeHtml("admin/print.html");
});

app.MapGet("/admin/print.html", (HttpContext http) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Redirect("/admin/login");
    }
    return ServeHtml("admin/print.html");
});

// 3. Auth API Routes
app.MapPost("/api/auth/login", async (HttpContext http, DatabaseService db, LoginRequest req) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
    {
        return Results.BadRequest(new { error = "Kullanıcı adı ve şifre gereklidir." });
    }

    using var connection = db.CreateConnection();
    var user = await connection.QueryFirstOrDefaultAsync<AdminUser>(
        "SELECT * FROM admin_users WHERE LOWER(username) = LOWER(@Username)",
        new { Username = req.Username.Trim() }
    );

    if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
    {
        return Results.Json(new { error = "Geçersiz kullanıcı adı veya şifre." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    if (user.IsActive == 0)
    {
        return Results.Json(new { error = "Hesabınız pasife alınmıştır. Lütfen sistem yöneticiniz ile iletişime geçiniz." }, statusCode: StatusCodes.Status403Forbidden);
    }

    var role = string.IsNullOrEmpty(user.Role) ? "worker" : user.Role;
    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Name, user.Username),
        new(ClaimTypes.Role, role),
        new("FullName", user.FullName ?? user.Username)
    };

    var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity));

    return Results.Ok(new
    {
        success = true,
        message = "Giriş başarılı.",
        user = new { id = user.Id, username = user.Username, role = role, fullName = user.FullName ?? user.Username }
    });
}).RequireRateLimiting("LoginLimiter");

app.MapPost("/api/auth/logout", async (HttpContext http) =>
{
    await http.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.Ok(new { success = true, message = "Oturum sonlandırıldı." });
});

app.MapGet("/api/auth/status", (HttpContext http) =>
{
    if (IsUserAuthenticated(http, out var id, out var username))
    {
        var role = GetUserRole(http);
        var fullName = http.User.FindFirst("FullName")?.Value ?? username;
        return Results.Ok(new { loggedIn = true, user = new { id, username, role, fullName } });
    }
    return Results.Ok(new { loggedIn = false });
});

app.MapPost("/api/auth/change-password", async (HttpContext http, DatabaseService db, ChangePasswordRequest req) =>
{
    if (!IsUserAuthenticated(http, out var userId, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 6)
    {
        return Results.BadRequest(new { error = "Yeni şifre en az 6 karakter olmalıdır." });
    }

    using var connection = db.CreateConnection();
    var user = await connection.QueryFirstOrDefaultAsync<AdminUser>(
        "SELECT * FROM admin_users WHERE id = @Id",
        new { Id = userId }
    );

    if (user == null)
    {
        return Results.Json(new { error = "Kullanıcı bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
    {
        return Results.BadRequest(new { error = "Mevcut şifreniz hatalı." });
    }

    var newHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
    await connection.ExecuteAsync(
        "UPDATE admin_users SET password_hash = @Hash, updated_at = CURRENT_TIMESTAMP WHERE id = @Id",
        new { Hash = newHash, Id = userId }
    );

    return Results.Ok(new { success = true, message = "Şifreniz başarıyla güncellendi." });
});

// 4. Documents API Routes
app.MapGet("/api/documents", async (HttpContext http, DatabaseService db, string? search, string? startDate, string? endDate, string? scope, int? isPaid) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    using var connection = db.CreateConnection();
    var sql = "SELECT * FROM documents WHERE 1=1";
    var parameters = new DynamicParameters();

    if (!string.IsNullOrWhiteSpace(search))
    {
        sql += " AND (doc_number LIKE @Search OR company_name LIKE @Search OR plate_number LIKE @Search OR driver_info LIKE @Search OR from_location LIKE @Search OR to_location LIKE @Search)";
        parameters.Add("Search", $"%{search.Trim()}%");
    }
    if (!string.IsNullOrWhiteSpace(startDate))
    {
        sql += " AND doc_date >= @StartDate";
        parameters.Add("StartDate", startDate);
    }
    if (!string.IsNullOrWhiteSpace(endDate))
    {
        sql += " AND doc_date <= @EndDate";
        parameters.Add("EndDate", endDate);
    }
    if (!string.IsNullOrWhiteSpace(scope))
    {
        sql += " AND shipping_scope = @Scope";
        parameters.Add("Scope", scope.Trim());
    }
    if (isPaid.HasValue)
    {
        sql += " AND is_paid = @IsPaid";
        parameters.Add("IsPaid", isPaid.Value);
    }

    sql += " ORDER BY id DESC";

    var documents = await connection.QueryAsync<Document>(sql, parameters);
    return Results.Ok(new { success = true, data = documents });
});

app.MapGet("/api/documents/next-number", (HttpContext http, DatabaseService db) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    var nextNumber = db.GenerateNextDocNumber();
    return Results.Ok(new { success = true, nextNumber });
});

app.MapGet("/api/documents/{id:int}", async (HttpContext http, DatabaseService db, int id) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    using var connection = db.CreateConnection();
    var doc = await connection.QueryFirstOrDefaultAsync<Document>(
        "SELECT * FROM documents WHERE id = @Id",
        new { Id = id }
    );

    if (doc == null)
    {
        return Results.Json(new { error = "Belge bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Ok(new { success = true, data = doc });
});

app.MapPost("/api/documents", async (HttpContext http, DatabaseService db, DocumentSaveRequest req) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    if (string.IsNullOrWhiteSpace(req.CompanyName))
    {
        return Results.BadRequest(new { error = "Firma adı zorunludur." });
    }

    var docDate = string.IsNullOrWhiteSpace(req.DocDate)
        ? DateTime.UtcNow.ToString("yyyy-MM-dd")
        : req.DocDate;

    var docNumber = string.IsNullOrWhiteSpace(req.DocNumber)
        ? db.GenerateNextDocNumber()
        : req.DocNumber.Trim();

    var shippingScope = !string.IsNullOrWhiteSpace(req.ShippingScope) ? req.ShippingScope.Trim() : "yurtici";
    var isPaid = req.IsPaid.HasValue && req.IsPaid.Value > 0 ? 1 : 0;

    string customFieldsJson = "[]";
    if (req.CustomFields != null)
    {
        if (req.CustomFields is string str)
        {
            customFieldsJson = str;
        }
        else if (req.CustomFields is JsonElement elem)
        {
            customFieldsJson = elem.GetRawText();
        }
        else
        {
            customFieldsJson = JsonSerializer.Serialize(req.CustomFields);
        }
    }

    using var connection = db.CreateConnection();
    try
    {
        var sql = @"
            INSERT INTO documents (
                doc_number, doc_date, company_name, from_location, to_location,
                plate_number, driver_info, price, currency, invoice_info,
                shipping_scope, is_paid,
                custom_fields_json, notes, created_at, updated_at
            ) VALUES (
                @DocNumber, @DocDate, @CompanyName, @FromLocation, @ToLocation,
                @PlateNumber, @DriverInfo, @Price, @Currency, @InvoiceInfo,
                @ShippingScope, @IsPaid,
                @CustomFieldsJson, @Notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            );
            SELECT last_insert_rowid();
        ";

        var newId = await connection.ExecuteScalarAsync<long>(sql, new
        {
            DocNumber = docNumber,
            DocDate = docDate,
            CompanyName = req.CompanyName.Trim(),
            FromLocation = req.FromLocation ?? "",
            ToLocation = req.ToLocation ?? "",
            PlateNumber = req.PlateNumber ?? "",
            DriverInfo = req.DriverInfo ?? "",
            Price = req.Price ?? 0,
            Currency = req.Currency ?? "TRY",
            InvoiceInfo = req.InvoiceInfo ?? "",
            ShippingScope = shippingScope,
            IsPaid = isPaid,
            CustomFieldsJson = customFieldsJson,
            Notes = req.Notes ?? ""
        });

        return Results.Ok(new
        {
            success = true,
            message = "Belge başarıyla oluşturuldu.",
            id = newId,
            doc_number = docNumber,
            shipping_scope = shippingScope,
            is_paid = isPaid
        });
    }
    catch (Exception ex) when (ex.Message.Contains("UNIQUE constraint failed"))
    {
        return Results.BadRequest(new { error = "Bu belge numarası zaten kayıtlı." });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = "Belge kaydedilirken sunucu tarafında bir hata oluştu." }, statusCode: StatusCodes.Status500InternalServerError);
    }
});

app.MapPut("/api/documents/{id:int}", async (HttpContext http, DatabaseService db, int id, DocumentSaveRequest req) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    if (string.IsNullOrWhiteSpace(req.CompanyName))
    {
        return Results.BadRequest(new { error = "Firma adı zorunludur." });
    }

    string customFieldsJson = "[]";
    if (req.CustomFields != null)
    {
        if (req.CustomFields is string str)
        {
            customFieldsJson = str;
        }
        else if (req.CustomFields is JsonElement elem)
        {
            customFieldsJson = elem.GetRawText();
        }
        else
        {
            customFieldsJson = JsonSerializer.Serialize(req.CustomFields);
        }
    }

    using var connection = db.CreateConnection();
    try
    {
        var sql = @"
            UPDATE documents SET
                doc_number = @DocNumber,
                doc_date = @DocDate,
                company_name = @CompanyName,
                from_location = @FromLocation,
                to_location = @ToLocation,
                plate_number = @PlateNumber,
                driver_info = @DriverInfo,
                price = @Price,
                currency = @Currency,
                invoice_info = @InvoiceInfo,
                shipping_scope = COALESCE(@ShippingScope, shipping_scope),
                is_paid = COALESCE(@IsPaid, is_paid),
                custom_fields_json = @CustomFieldsJson,
                notes = @Notes,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @Id;
        ";

        var affected = await connection.ExecuteAsync(sql, new
        {
            DocNumber = req.DocNumber?.Trim() ?? "",
            DocDate = req.DocDate ?? "",
            CompanyName = req.CompanyName.Trim(),
            FromLocation = req.FromLocation ?? "",
            ToLocation = req.ToLocation ?? "",
            PlateNumber = req.PlateNumber ?? "",
            DriverInfo = req.DriverInfo ?? "",
            Price = req.Price ?? 0,
            Currency = req.Currency ?? "TRY",
            InvoiceInfo = req.InvoiceInfo ?? "",
            ShippingScope = req.ShippingScope,
            IsPaid = req.IsPaid,
            CustomFieldsJson = customFieldsJson,
            Notes = req.Notes ?? "",
            Id = id
        });

        if (affected == 0)
        {
            return Results.Json(new { error = "Güncellenecek belge bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
        }

        return Results.Ok(new { success = true, message = "Belge başarıyla güncellendi." });
    }
    catch (Exception ex) when (ex.Message.Contains("UNIQUE constraint failed"))
    {
        return Results.BadRequest(new { error = "Bu belge numarası başka bir kayıtta kullanılıyor." });
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = "Belge güncellenirken sunucu tarafında bir hata oluştu." }, statusCode: StatusCodes.Status500InternalServerError);
    }
});

// Quick Document Status / Scope / Payment Update (Outside of document body content)
async Task<IResult> UpdateDocumentStatusAsync(HttpContext http, DatabaseService db, int id, DocumentStatusUpdateRequest req)
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    using var connection = db.CreateConnection();
    var doc = await connection.QueryFirstOrDefaultAsync<Document>(
        "SELECT id, doc_number, shipping_scope, is_paid FROM documents WHERE id = @Id",
        new { Id = id }
    );

    if (doc == null)
    {
        return Results.Json(new { error = "Belge bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    var newScope = !string.IsNullOrWhiteSpace(req.ShippingScope) ? req.ShippingScope.Trim() : doc.ShippingScope;
    var newIsPaid = req.IsPaid.HasValue ? (req.IsPaid.Value > 0 ? 1 : 0) : doc.IsPaid;

    await connection.ExecuteAsync(@"
        UPDATE documents SET 
            shipping_scope = @ShippingScope, 
            is_paid = @IsPaid, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = @Id",
        new { ShippingScope = newScope, IsPaid = newIsPaid, Id = id }
    );

    return Results.Ok(new
    {
        success = true,
        message = "Belge özellikleri başarıyla güncellendi.",
        id = id,
        doc_number = doc.DocNumber,
        shipping_scope = newScope,
        is_paid = newIsPaid
    });
}

app.MapPost("/api/documents/{id:int}/status", (HttpContext http, DatabaseService db, int id, DocumentStatusUpdateRequest req) => 
    UpdateDocumentStatusAsync(http, db, id, req));
app.MapPatch("/api/documents/{id:int}/status", (HttpContext http, DatabaseService db, int id, DocumentStatusUpdateRequest req) => 
    UpdateDocumentStatusAsync(http, db, id, req));

app.MapDelete("/api/documents/{id:int}", async (HttpContext http, DatabaseService db, int id) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Belge silme işlemi yalnızca yönetici (admin) tarafından yapılabilir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    using var connection = db.CreateConnection();
    var affected = await connection.ExecuteAsync("DELETE FROM documents WHERE id = @Id", new { Id = id });

    if (affected == 0)
    {
        return Results.Json(new { error = "Silinecek belge bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Ok(new { success = true, message = "Belge başarıyla silindi." });
});

app.MapPost("/api/documents/{id:int}/print-log", async (HttpContext http, DatabaseService db, int id) =>
{
    if (!IsUserAuthenticated(http, out _, out _))
    {
        return Results.Json(new { error = "Oturum açmanız gerekiyor." }, statusCode: StatusCodes.Status401Unauthorized);
    }

    using var connection = db.CreateConnection();
    await connection.ExecuteAsync(
        "UPDATE documents SET print_count = print_count + 1, last_printed_at = CURRENT_TIMESTAMP WHERE id = @Id",
        new { Id = id }
    );

    return Results.Ok(new { success = true, message = "Yazdırma kaydı güncellendi." });
});

// 5. Worker Management API Routes (Admin Only)
app.MapGet("/api/admin/workers", async (HttpContext http, DatabaseService db) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    using var connection = db.CreateConnection();
    var workers = await connection.QueryAsync<AdminUser>(
        "SELECT id, username, role, is_active, full_name, created_at, updated_at FROM admin_users ORDER BY id DESC"
    );

    return Results.Ok(new { success = true, data = workers });
});

app.MapPost("/api/admin/workers", async (HttpContext http, DatabaseService db, CreateWorkerRequest req) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
    {
        return Results.BadRequest(new { error = "Kullanıcı adı ve şifre zorunludur." });
    }

    var cleanUsername = req.Username.Trim();
    if (cleanUsername.Length < 3)
    {
        return Results.BadRequest(new { error = "Kullanıcı adı en az 3 karakter olmalıdır." });
    }

    if (req.Password.Length < 4)
    {
        return Results.BadRequest(new { error = "Şifre en az 4 karakter olmalıdır." });
    }

    using var connection = db.CreateConnection();
    var existing = await connection.ExecuteScalarAsync<int>(
        "SELECT COUNT(*) FROM admin_users WHERE LOWER(username) = LOWER(@Username)",
        new { Username = cleanUsername }
    );

    if (existing > 0)
    {
        return Results.BadRequest(new { error = "Bu kullanıcı adı zaten kullanılmaktadır." });
    }

    var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);
    var newId = await connection.ExecuteScalarAsync<long>(@"
        INSERT INTO admin_users (username, password_hash, role, is_active, full_name, created_at, updated_at)
        VALUES (@Username, @Hash, 'worker', 1, @FullName, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
        SELECT last_insert_rowid();
    ", new
    {
        Username = cleanUsername,
        Hash = hash,
        FullName = string.IsNullOrWhiteSpace(req.FullName) ? cleanUsername : req.FullName.Trim()
    });

    return Results.Ok(new
    {
        success = true,
        message = "Çalışan hesabı başarıyla oluşturuldu.",
        id = newId
    });
});

app.MapPut("/api/admin/workers/{id:int}/toggle-status", async (HttpContext http, DatabaseService db, int id) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    IsUserAuthenticated(http, out var currentUserId, out _);
    if (currentUserId == id)
    {
        return Results.BadRequest(new { error = "Kendi hesabınızın durumunu değiştiremezsiniz." });
    }

    using var connection = db.CreateConnection();
    var target = await connection.QueryFirstOrDefaultAsync<AdminUser>(
        "SELECT id, username, role, is_active FROM admin_users WHERE id = @Id",
        new { Id = id }
    );

    if (target == null)
    {
        return Results.Json(new { error = "Kullanıcı bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    int nextStatus = target.IsActive == 1 ? 0 : 1;
    await connection.ExecuteAsync(
        "UPDATE admin_users SET is_active = @Status, updated_at = CURRENT_TIMESTAMP WHERE id = @Id",
        new { Status = nextStatus, Id = id }
    );

    return Results.Ok(new
    {
        success = true,
        message = nextStatus == 1 ? "Çalışan hesabı aktifleştirildi." : "Çalışan hesabı pasife alındı.",
        isActive = nextStatus
    });
});

app.MapPut("/api/admin/workers/{id:int}/reset-password", async (HttpContext http, DatabaseService db, int id, ResetWorkerPasswordRequest req) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 4)
    {
        return Results.BadRequest(new { error = "Yeni şifre en az 4 karakter olmalıdır." });
    }

    using var connection = db.CreateConnection();
    var target = await connection.QueryFirstOrDefaultAsync<AdminUser>(
        "SELECT id FROM admin_users WHERE id = @Id",
        new { Id = id }
    );

    if (target == null)
    {
        return Results.Json(new { error = "Kullanıcı bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    var hash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
    await connection.ExecuteAsync(
        "UPDATE admin_users SET password_hash = @Hash, updated_at = CURRENT_TIMESTAMP WHERE id = @Id",
        new { Hash = hash, Id = id }
    );

    return Results.Ok(new { success = true, message = "Çalışanın şifresi başarıyla güncellendi." });
});

app.MapDelete("/api/admin/workers/{id:int}", async (HttpContext http, DatabaseService db, int id) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    IsUserAuthenticated(http, out var currentUserId, out _);
    if (currentUserId == id)
    {
        return Results.BadRequest(new { error = "Kendi hesabınızı silemezsiniz." });
    }

    using var connection = db.CreateConnection();
    var target = await connection.QueryFirstOrDefaultAsync<AdminUser>(
        "SELECT id, role FROM admin_users WHERE id = @Id",
        new { Id = id }
    );

    if (target == null)
    {
        return Results.Json(new { error = "Kullanıcı bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    if (target.Role == "admin")
    {
        return Results.BadRequest(new { error = "Yönetici hesabı buradan silinemez." });
    }

    await connection.ExecuteAsync("DELETE FROM admin_users WHERE id = @Id", new { Id = id });
    return Results.Ok(new { success = true, message = "Çalışan hesabı silindi." });
});

// 6. Business Contacts & SnapMap API Routes (Admin Only)
app.MapGet("/api/contacts", async (HttpContext http, DatabaseService db, string? search) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    using var connection = db.CreateConnection();
    var sql = "SELECT * FROM contacts WHERE 1=1";
    var parameters = new DynamicParameters();

    if (!string.IsNullOrWhiteSpace(search))
    {
        sql += " AND (name LIKE @Search OR company_name LIKE @Search OR phone LIKE @Search OR from_location LIKE @Search OR to_location LIKE @Search OR notes LIKE @Search OR location_name LIKE @Search)";
        parameters.Add("Search", $"%{search.Trim()}%");
    }

    sql += " ORDER BY id DESC";
    var contacts = await connection.QueryAsync<Contact>(sql, parameters);
    return Results.Ok(new { success = true, data = contacts });
});

app.MapGet("/api/contacts/{id:int}", async (HttpContext http, DatabaseService db, int id) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    using var connection = db.CreateConnection();
    var contact = await connection.QueryFirstOrDefaultAsync<Contact>(
        "SELECT * FROM contacts WHERE id = @Id",
        new { Id = id }
    );

    if (contact == null)
    {
        return Results.Json(new { error = "Kişi kaydı bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Ok(new { success = true, data = contact });
});

app.MapPost("/api/contacts", async (HttpContext http, DatabaseService db, ContactSaveRequest req) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    // Bilgilerin hepsi doldurulma zorunluğu yok
    var name = string.IsNullOrWhiteSpace(req.Name) 
        ? (!string.IsNullOrWhiteSpace(req.CompanyName) ? req.CompanyName.Trim() : "İsimsiz Kayıt")
        : req.Name.Trim();

    using var connection = db.CreateConnection();
    var sql = @"
        INSERT INTO contacts (
            name, company_name, phone, email, from_location, to_location,
            cargo_type, plate_number, latitude, longitude, location_name,
            notes, status, avatar_color, created_at, updated_at
        ) VALUES (
            @Name, @CompanyName, @Phone, @Email, @FromLocation, @ToLocation,
            @CargoType, @PlateNumber, @Latitude, @Longitude, @LocationName,
            @Notes, @Status, @AvatarColor, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
        SELECT last_insert_rowid();
    ";

    var newId = await connection.ExecuteScalarAsync<long>(sql, new
    {
        Name = name,
        CompanyName = req.CompanyName?.Trim() ?? "",
        Phone = req.Phone?.Trim() ?? "",
        Email = req.Email?.Trim() ?? "",
        FromLocation = req.FromLocation?.Trim() ?? "",
        ToLocation = req.ToLocation?.Trim() ?? "",
        CargoType = req.CargoType?.Trim() ?? "",
        PlateNumber = req.PlateNumber?.Trim() ?? "",
        Latitude = req.Latitude,
        Longitude = req.Longitude,
        LocationName = req.LocationName?.Trim() ?? "",
        Notes = req.Notes?.Trim() ?? "",
        Status = string.IsNullOrWhiteSpace(req.Status) ? "active" : req.Status.Trim(),
        AvatarColor = string.IsNullOrWhiteSpace(req.AvatarColor) ? "#FF6500" : req.AvatarColor.Trim()
    });

    return Results.Ok(new
    {
        success = true,
        message = "Kişi kaydı başarıyla oluşturuldu.",
        id = newId
    });
});

app.MapPut("/api/contacts/{id:int}", async (HttpContext http, DatabaseService db, int id, ContactSaveRequest req) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    var name = string.IsNullOrWhiteSpace(req.Name) 
        ? (!string.IsNullOrWhiteSpace(req.CompanyName) ? req.CompanyName.Trim() : "İsimsiz Kayıt")
        : req.Name.Trim();

    using var connection = db.CreateConnection();
    var sql = @"
        UPDATE contacts SET
            name = @Name,
            company_name = @CompanyName,
            phone = @Phone,
            email = @Email,
            from_location = @FromLocation,
            to_location = @ToLocation,
            cargo_type = @CargoType,
            plate_number = @PlateNumber,
            latitude = @Latitude,
            longitude = @Longitude,
            location_name = @LocationName,
            notes = @Notes,
            status = @Status,
            avatar_color = @AvatarColor,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = @Id;
    ";

    var affected = await connection.ExecuteAsync(sql, new
    {
        Name = name,
        CompanyName = req.CompanyName?.Trim() ?? "",
        Phone = req.Phone?.Trim() ?? "",
        Email = req.Email?.Trim() ?? "",
        FromLocation = req.FromLocation?.Trim() ?? "",
        ToLocation = req.ToLocation?.Trim() ?? "",
        CargoType = req.CargoType?.Trim() ?? "",
        PlateNumber = req.PlateNumber?.Trim() ?? "",
        Latitude = req.Latitude,
        Longitude = req.Longitude,
        LocationName = req.LocationName?.Trim() ?? "",
        Notes = req.Notes?.Trim() ?? "",
        Status = string.IsNullOrWhiteSpace(req.Status) ? "active" : req.Status.Trim(),
        AvatarColor = string.IsNullOrWhiteSpace(req.AvatarColor) ? "#FF6500" : req.AvatarColor.Trim(),
        Id = id
    });

    if (affected == 0)
    {
        return Results.Json(new { error = "Güncellenecek kayıt bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Ok(new { success = true, message = "Kişi kaydı başarıyla güncellendi." });
});

app.MapDelete("/api/contacts/{id:int}", async (HttpContext http, DatabaseService db, int id) =>
{
    if (!IsAdmin(http))
    {
        return Results.Json(new { error = "Bu işlem için yönetici yetkisi gereklidir." }, statusCode: StatusCodes.Status403Forbidden);
    }

    using var connection = db.CreateConnection();
    var affected = await connection.ExecuteAsync("DELETE FROM contacts WHERE id = @Id", new { Id = id });

    if (affected == 0)
    {
        return Results.Json(new { error = "Silinecek kayıt bulunamadı." }, statusCode: StatusCodes.Status404NotFound);
    }

    return Results.Ok(new { success = true, message = "Kişi kaydı başarıyla silindi." });
});

// 7. 404 Fallback Route
app.MapFallback((HttpContext http) =>
{
    http.Response.StatusCode = StatusCodes.Status404NotFound;
    return Results.Content(@"
        <!DOCTYPE html>
        <html lang=""tr"">
        <head>
            <meta charset=""UTF-8"">
            <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
            <title>404 - Sayfa Bulunamadı | Roads-on</title>
            <style>
                body { font-family: 'Plus Jakarta Sans', sans-serif; background: #070F1E; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
                .box { max-width: 500px; padding: 40px; background: #0B192C; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); }
                h1 { font-size: 3rem; color: #FF6500; margin: 0 0 10px; }
                p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
                a { display: inline-block; background: #FF6500; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; }
                a:hover { background: #E85C0D; }
            </style>
        </head>
        <body>
            <div class=""box"">
                <h1>404</h1>
                <h2>Sayfa Bulunamadı</h2>
                <p>Aradığınız sayfa silinmiş, adı değiştirilmiş veya geçici olarak kullanılamıyor olabilir.</p>
                <a href=""/"">&larr; Ana Sayfaya Dön</a>
            </div>
        </body>
        </html>
    ", "text/html; charset=utf-8");
});

app.Run();
