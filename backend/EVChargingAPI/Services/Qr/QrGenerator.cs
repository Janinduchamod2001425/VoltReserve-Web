/*
 * File: QrGenerator.cs
 * Description: Wrapper around QRCoder to produce PNG byte arrays from JSON payloads.
 * Author: Kavinda S.G.D
 * Last Modified: 2025-10-10
 * Notes: Uses ECC Level M and serializes the payload with System.Text.Json.
 */



using QRCoder;
using System.Text;
using System.Text.Json;

namespace EVChargingAPI.Services.Qr
{
    /// <summary>Generates QR codes as PNG bytes.</summary>
    public interface IQrGenerator
    {
        /// <summary>Generate QR PNG for an object payload.</summary>
        byte[] GeneratePng(object payload, int pixelsPerModule = 8);
    }

    public class QrGenerator : IQrGenerator
    {
        // <inheritdoc />
        public byte[] GeneratePng(object payload, int pixelsPerModule = 8)
        {
            var json = JsonSerializer.Serialize(payload);
            using var generator = new QRCodeGenerator();
            using var data = generator.CreateQrCode(json, QRCodeGenerator.ECCLevel.M);
            var png = new PngByteQRCode(data);
            return png.GetGraphic(pixelsPerModule);
        }
    }
}
