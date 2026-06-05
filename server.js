const express = require('express');
const sgMail = require('@sendgrid/mail');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// SendGrid API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EMAIL_TO = [
  'Ushers@pacers.com',
  'sadams-pantano@pacers.com'
];

const FROM_EMAIL = process.env.FROM_EMAIL || 'equipment@pacers.com';

app.post('/send-report', async (req, res) => {
  try {
    const { pdfBase64, eventName, eventDate, supervisorName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF data received' });
    }

    const subject = `Equipment Log — ${eventName || 'Event'}${eventDate ? ' | ' + eventDate : ''}`;
    const filename = `EquipmentLog_${(eventName || 'Event').replace(/\s+/g, '_')}_${eventDate || 'nodate'}.pdf`;

    const msg = {
      to: EMAIL_TO,
      from: { email: FROM_EMAIL, name: 'Usher Equipment Log' },
      subject,
      text: `Hi,\n\nPlease find the equipment log attached for ${eventName || 'the event'}${eventDate ? ' on ' + eventDate : ''}${supervisorName ? ' (Supervisor: ' + supervisorName + ')' : ''}.\n\nThis report was automatically generated from the Usher Equipment Log app.\n\nThank you.`,
      html: `<p>Hi,</p><p>Please find the equipment log attached for <strong>${eventName || 'the event'}</strong>${eventDate ? ' on ' + eventDate : ''}${supervisorName ? ' (Supervisor: ' + supervisorName + ')' : ''}.</p><p>This report was automatically generated from the Usher Equipment Log app.</p><p>Thank you.</p>`,
      attachments: [
        {
          content: pdfBase64,
          filename,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    };

    await sgMail.sendMultiple(msg);
    res.json({ success: true, message: 'Report sent successfully!' });

  } catch (error) {
    console.error('Email send error:', error?.response?.body || error.message);
    res.status(500).json({ error: 'Failed to send email. Please check your SendGrid setup.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Usher Equipment Log running on port ${PORT}`));
