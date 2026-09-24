using System.Text.Json.Serialization;

namespace RoadsOn.Models;

public class AdminUser
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("username")]
    public string Username { get; set; } = string.Empty;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [JsonIgnore]
    public string password_hash { get => PasswordHash; set => PasswordHash = value; }

    [JsonPropertyName("role")]
    public string Role { get; set; } = "worker"; // "admin" or "worker"

    [JsonPropertyName("is_active")]
    public int IsActive { get; set; } = 1; // 1 = Active, 0 = Passive

    [JsonPropertyName("full_name")]
    public string? FullName { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }
}

public class LoginRequest
{
    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }
}

public class ChangePasswordRequest
{
    [JsonPropertyName("currentPassword")]
    public string? CurrentPassword { get; set; }

    [JsonPropertyName("newPassword")]
    public string? NewPassword { get; set; }
}

public class CreateWorkerRequest
{
    [JsonPropertyName("username")]
    public string? Username { get; set; }

    [JsonPropertyName("password")]
    public string? Password { get; set; }

    [JsonPropertyName("fullName")]
    public string? FullName { get; set; }
}

public class ResetWorkerPasswordRequest
{
    [JsonPropertyName("newPassword")]
    public string? NewPassword { get; set; }
}

public class ToggleWorkerStatusRequest
{
    [JsonPropertyName("isActive")]
    public int? IsActive { get; set; }
}

