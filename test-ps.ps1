[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$body = @{
    from = "VyNexa Connect <noreply@vyntyraconsultancyservices.in>"
    to = "jamianil37@gmail.com"
    subject = "Test Email from Project VyNexa (Resend API)"
    html = "<strong>This is a test email sent using Resend! The email migration was successful.</strong>"
} | ConvertTo-Json

$apiKey = if ($env:RESEND_API_KEY) { $env:RESEND_API_KEY } else { (Get-Content .env | Select-String "RESEND_API_KEY").ToString().Split('"')[1] }
Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers @{ "Authorization" = "Bearer $apiKey"; "Content-Type" = "application/json" } -Body $body
