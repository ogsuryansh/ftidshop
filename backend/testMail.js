const nodemailer = require('nodemailer');

async function sendTestEmail() {
  try {
    // Generate a temporary Ethereal test account for this run
    let testAccount = await nodemailer.createTestAccount();
    console.log('Created temporary test account: %s', testAccount.user);

    // Create a transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, 
        pass: testAccount.pass, 
      },
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

    // Send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"ArpanFtid Admin" <admin@arpanftid.com>', // sender address
      to: "vishalgiri0044@gmail.com", // list of receivers
      subject: "Your Admin Login OTP Code", // Subject line
      text: `Your 2-step verification code is: ${otpCode}`, // plain text body
      html: `<b>Your 2-step verification code is: ${otpCode}</b>`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    
    // Preview only available when sending through an Ethereal account
    console.log("\n==========================================");
    console.log("PREVIEW URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("==========================================\n");
    console.log("NOTE: This email was sent using Ethereal (a temp mail testing service).");
    console.log("It will NOT arrive in your actual Gmail inbox. Instead, click the Preview URL above to see exactly how the email would look.");
  } catch (error) {
    console.error("Error sending test email:", error);
  }
}

sendTestEmail();
