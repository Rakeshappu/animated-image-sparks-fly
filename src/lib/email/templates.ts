export const getVerificationEmailTemplate = (otp: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
    .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="color: #4F46E5;">Welcome to Versatile Share!</h1>
    <p>Please click the button below to verify your email address:</p>
    <a href="" class="button">${otp}</a>
    
    <p>This verification link will expire in 24 hours.</p>
  </div>
</body>
</html>
`;