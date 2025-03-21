const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['host_invoice', 'cleaner_invoice', 'platform_invoice'],
    required: true
  },
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true
  },
  issuedTo: {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: {
        type: String,
        default: 'France'
      }
    },
    email: {
      type: String,
      required: true
    },
    siret: String
  },
  issuedBy: {
    name: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: {
        type: String,
        default: 'France'
      }
    },
    email: String,
    siret: String,
    vatNumber: String
  },
  items: [{
    description: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    }
  }],
  subtotal: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    default: 20 // 20% TVA standard en France
  },
  taxAmount: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled', 'overdue'],
    default: 'draft'
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['card', 'bank_transfer', 'platform_credit'],
      required: true
    },
    transactionId: String,
    paidAt: Date
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  notes: String,
  termsAndConditions: String,
  pdfUrl: String
});

// Générer automatiquement le numéro de facture lors de la création
InvoiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastInvoice = await this.constructor.findOne().sort({ createdAt: -1 });
    
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      // Extraire le numéro de la dernière facture (format: INV-YYYYMMDD-XXXX)
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }
    
    // Générer le numéro de facture avec le format INV-YYYYMMDD-XXXX
    const today = new Date();
    const dateString = today.getFullYear().toString() +
                      (today.getMonth() + 1).toString().padStart(2, '0') +
                      today.getDate().toString().padStart(2, '0');
    
    this.invoiceNumber = `INV-${dateString}-${nextNumber.toString().padStart(4, '0')}`;
  }
  next();
});

// Calcul du montant de la TVA et du total
InvoiceSchema.pre('save', function(next) {
  // Recalcul du sous-total à partir des éléments
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calcul de la TVA
  this.taxAmount = Math.round((this.subtotal * this.taxRate / 100) * 100) / 100;
  
  // Calcul du total
  this.totalAmount = this.subtotal + this.taxAmount;
  
  next();
});

module.exports = mongoose.model('Invoice', InvoiceSchema);