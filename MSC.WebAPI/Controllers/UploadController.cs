using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MSC.WebAPI.DTOs;

namespace MSC.WebAPI.Controllers
{
    [Authorize(Roles = "SuperAdmin,ContentEditor")]
    [Route("api/upload")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly ILogger<UploadController> _logger;
        private readonly HashSet<string> _allowedContainers = new()
        {
            "member-images",
            "event-images",
            "certificates"
        };

        public UploadController(BlobServiceClient blobServiceClient, ILogger<UploadController> logger)
        {
            _blobServiceClient = blobServiceClient;
            _logger = logger;
        }

        /// <summary>
        /// Generate SAS token for blob upload (SuperAdmin/ContentEditor only)
        /// </summary>
        [HttpPost("generate-sas-token")]
        public async Task<ActionResult<SasTokenResponse>> GenerateSasToken(GenerateSasTokenRequest request)
        {
            try
            {
                // Validate container name
                if (!_allowedContainers.Contains(request.ContainerName.ToLower()))
                {
                    _logger.LogWarning("Invalid container name requested: {ContainerName}", request.ContainerName);
                    return BadRequest(new { message = $"Invalid container name. Allowed containers: {string.Join(", ", _allowedContainers)}" });
                }

                // Validate file name
                if (string.IsNullOrWhiteSpace(request.FileName) || request.FileName.Contains(".."))
                {
                    _logger.LogWarning("Invalid file name: {FileName}", request.FileName);
                    return BadRequest(new { message = "Invalid file name" });
                }

                // Get container client
                var containerClient = _blobServiceClient.GetBlobContainerClient(request.ContainerName.ToLower());

                // Ensure container exists
                await containerClient.CreateIfNotExistsAsync();

                // Get blob client
                var blobClient = containerClient.GetBlobClient(request.FileName);

                // Generate SAS token with write permission (15 minutes expiration)
                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = request.ContainerName.ToLower(),
                    BlobName = request.FileName,
                    Resource = "b", // "b" for blob
                    ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(15)
                };

                // Set permissions (write only)
                sasBuilder.SetPermissions(BlobSasPermissions.Write | BlobSasPermissions.Create);

                // Generate the SAS URI
                Uri sasUri = blobClient.GenerateSasUri(sasBuilder);

                var expiresAt = DateTime.UtcNow.AddMinutes(15);

                _logger.LogInformation("Generated SAS token for blob {FileName} in container {ContainerName}, expires at {ExpiresAt}",
                    request.FileName, request.ContainerName, expiresAt);

                return Ok(new SasTokenResponse
                {
                    SasUrl = sasUri.ToString(),
                    ExpiresAt = expiresAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating SAS token for {FileName} in {ContainerName}",
                    request.FileName, request.ContainerName);
                return StatusCode(500, new { message = "Error generating SAS token" });
            }
        }
    }
}
