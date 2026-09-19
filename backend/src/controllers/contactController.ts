import { Request, Response } from 'express';
import SupportMessage from '../models/SupportMessage';
import { sendAutoResponderEmail } from '../services/emailService';

export const submitContactMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const subject = String(req.body.subject || '').trim();
    const message = String(req.body.message || '').trim();
    const category = req.body.category || 'GENERAL';

    if (!name || !email || !subject || !message) {
      res.status(400).json({ error: 'Please provide your name, email, subject, and message.' });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const supportTicket = await SupportMessage.create({
      name,
      email,
      subject,
      message,
      category,
      status: 'PENDING',
      replies: []
    });

    // Send autoresponder email asynchronously
    sendAutoResponderEmail({ email, name, subject, message }).catch(err => {
      console.warn('Autoresponder sending error (handled):', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received and an auto-responder confirmation has been dispatched to your email.',
      ticketId: supportTicket._id
    });
  } catch (error: any) {
    console.error('Contact submission error:', error);
    res.status(500).json({ error: 'Failed to submit contact message. Please try again or write directly to logiterax@gmail.com.' });
  }
};
