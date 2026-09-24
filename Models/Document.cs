using System.Text.Json.Serialization;

namespace RoadsOn.Models;

public class Document
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("doc_number")]
    public string DocNumber { get; set; } = string.Empty;

    [JsonPropertyName("doc_date")]
    public string DocDate { get; set; } = string.Empty;

    [JsonPropertyName("company_name")]
    public string CompanyName { get; set; } = string.Empty;

    [JsonPropertyName("from_location")]
    public string? FromLocation { get; set; }

    [JsonPropertyName("to_location")]
    public string? ToLocation { get; set; }

    [JsonPropertyName("plate_number")]
    public string? PlateNumber { get; set; }

    [JsonPropertyName("driver_info")]
    public string? DriverInfo { get; set; }

    [JsonPropertyName("price")]
    public double Price { get; set; }

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "TRY";

    [JsonPropertyName("invoice_info")]
    public string? InvoiceInfo { get; set; }

    [JsonPropertyName("shipping_scope")]
    public string ShippingScope { get; set; } = "yurtici";

    [JsonPropertyName("is_paid")]
    public int IsPaid { get; set; } = 0;

    [JsonPropertyName("custom_fields_json")]
    public string? CustomFieldsJson { get; set; } = "[]";

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }

    [JsonPropertyName("print_count")]
    public int PrintCount { get; set; }

    [JsonPropertyName("last_printed_at")]
    public string? LastPrintedAt { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("updated_at")]
    public string? UpdatedAt { get; set; }
}

public class DocumentSaveRequest
{
    [JsonPropertyName("doc_number")]
    public string? DocNumber { get; set; }

    [JsonPropertyName("doc_date")]
    public string? DocDate { get; set; }

    [JsonPropertyName("company_name")]
    public string CompanyName { get; set; } = string.Empty;

    [JsonPropertyName("from_location")]
    public string? FromLocation { get; set; }

    [JsonPropertyName("to_location")]
    public string? ToLocation { get; set; }

    [JsonPropertyName("plate_number")]
    public string? PlateNumber { get; set; }

    [JsonPropertyName("driver_info")]
    public string? DriverInfo { get; set; }

    [JsonPropertyName("price")]
    public double? Price { get; set; }

    [JsonPropertyName("currency")]
    public string? Currency { get; set; }

    [JsonPropertyName("invoice_info")]
    public string? InvoiceInfo { get; set; }

    [JsonPropertyName("shipping_scope")]
    public string? ShippingScope { get; set; }

    [JsonPropertyName("is_paid")]
    public int? IsPaid { get; set; }

    [JsonPropertyName("custom_fields")]
    public object? CustomFields { get; set; }

    [JsonPropertyName("notes")]
    public string? Notes { get; set; }
}

public class DocumentStatusUpdateRequest
{
    [JsonPropertyName("shipping_scope")]
    public string? ShippingScope { get; set; }

    [JsonPropertyName("is_paid")]
    public int? IsPaid { get; set; }
}
