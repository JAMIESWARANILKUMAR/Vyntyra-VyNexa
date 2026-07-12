[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }

$body = @{
    from = "VyNexa Connect <noreply@vyntyraconsultancyservices.in>"
    to = "jamianil37@gmail.com"
    subject = "Test Email from Project VyNexa (Resend API)"
    html = "<strong>This is a test email sent using Resend! The email migration was successful.</strong>"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method Post -Headers @{ "Authorization" = "Bearer re_VEjqAMWv_5Fvz7sJ2u4EKbkPSDBvb2Cme"; "Content-Type" = "application/json" } -Body $body
