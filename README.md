# Guns N' Roses Site with Email Verification

This project now includes a small Node.js email backend to send real verification codes for signup and password reset.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your SMTP credentials.
   - For Gmail, use `smtp.gmail.com`, port `587`, secure `false`.
   - Use an App Password for `SMTP_PASS`.

4. Start the server:
   ```bash
   npm start
   ```

5. Open the site in your browser:
   ```
   http://localhost:3000
   ```

   If you want to use the site on a phone or tablet on the same Wi-Fi network, open:
   ```
   http://<your-computer-ip>:3000
   ```

## Notes

- If the email backend cannot send, the app will fall back to opening your email client with a prefilled `mailto:` message.
- The verification code still validates in the browser, but the email is now delivered from the server if properly configured.
