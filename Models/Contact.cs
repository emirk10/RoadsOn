using System.Text.Json.Serialization;

namespace RoadsOn.Models;

public class Contact
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("company_name")]
    public string? CompanyName { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("from_location")]
    public string? FromLocation { get; set; }

    [JsonPropertyName("to_location")]
    public string? ToLocation { get; set; }

    [JsonPropertyName("cargo_type")]
    public string? CargoType { get; set; }

    [JsonPropertyName("plate_number")]
    public string? PlateNumber { get; set; }

    [JsonPropertyName("latitude")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public double? Latitude { get; set; }

    [JsonPropertyName("longitude")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public double? Longitude { get; set; }

    [JsonPropertyName("location_name")]
    public string? LocationName { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "active";

    [JsonPropertyName("avatar_color")]
    public string AvatarColor { get; set; } = "#FF6500";

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }
}

public class ContactSaveRequest
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("companyName")]
    public string? CompanyName { get; set; }

    [JsonPropertyName("company_name")]
    public string? CompanyNameAlias { get => CompanyName; set => CompanyName = value; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("fromLocation")]
    public string? FromLocation { get; set; }

    [JsonPropertyName("from_location")]
    public string? FromLocationAlias { get => FromLocation; set => FromLocation = value; }

    [JsonPropertyName("toLocation")]
    public string? ToLocation { get; set; }

    [JsonPropertyName("to_location")]
    public string? ToLocationAlias { get => ToLocation; set => ToLocation = value; }

    [JsonPropertyName("cargoType")]
    public string? CargoType { get; set; }

    [JsonPropertyName("cargo_type")]
    public string? CargoTypeAlias { get => CargoType; set => CargoType = value; }

    [JsonPropertyName("plateNumber")]
    public string? PlateNumber { get; set; }

    [JsonPropertyName("plate_number")]
    public string? PlateNumberAlias { get => PlateNumber; set => PlateNumber = value; }

    [JsonPropertyName("latitude")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public double? Latitude { get; set; }

    [JsonPropertyName("longitude")]
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public double? Longitude { get; set; }

    [JsonPropertyName("locationName")]
    public string? LocationName { get; set; }

    [JsonPropertyName("location_name")]
    public string? LocationNameAlias { get => LocationName; set => LocationName = value; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("avatarColor")]
    public string? AvatarColor { get; set; }

    [JsonPropertyName("avatar_color")]
    public string? AvatarColorAlias { get => AvatarColor; set => AvatarColor = value; }
}
