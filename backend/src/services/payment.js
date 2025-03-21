/**
 * Service de paiement avec Stripe
 * Gère les paiements des hébergeurs et les versements aux professionnels de ménage
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Créer une intention de paiement pour une réservation
 * @param {Object} booking - Objet de réservation
 * @param {string} customerId - ID client Stripe (optionnel)
 * @returns {Promise<Object>} Intention de paiement Stripe
 */
exports.createPaymentIntent = async (booking, customerId = null) => {
  try {
    const amount = Math.round(booking.payment.amount * 100); // Conversion en centimes

    const paymentIntentData = {
      amount,
      currency: booking.payment.currency || 'eur',
      metadata: {
        bookingId: booking._id.toString(),
        hostId: booking.host.toString(),
        cleanerId: booking.cleaner.toString(),
        listingId: booking.listing.toString()
      },
      description: `Réservation de ménage #${booking._id}`,
      capture_method: 'manual', // Capture manuelle (autorisation seulement)
    };

    // Si un customerId est fourni, l'associer à l'intention de paiement
    if (customerId) {
      paymentIntentData.customer = customerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Erreur lors de la création de l\'intention de paiement:', error);
    throw new Error('Erreur lors de la création de l\'intention de paiement');
  }
};

/**
 * Capturer un paiement après avoir autorisé une intention de paiement
 * @param {string} paymentIntentId - ID de l'intention de paiement à capturer
 * @returns {Promise<Object>} Résultat de la capture du paiement
 */
exports.capturePayment = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    return {
      success: paymentIntent.status === 'succeeded',
      paymentIntent
    };
  } catch (error) {
    console.error('Erreur lors de la capture du paiement:', error);
    throw new Error('Erreur lors de la capture du paiement');
  }
};

/**
 * Créer ou récupérer un customer Stripe pour un hébergeur
 * @param {Object} host - Objet hébergeur
 * @param {Object} user - Objet utilisateur associé
 * @returns {Promise<string>} ID du customer Stripe
 */
exports.createOrGetCustomer = async (host, user) => {
  try {
    if (host.stripeCustomerId) {
      // Vérifier si le customer existe toujours dans Stripe
      const customer = await stripe.customers.retrieve(host.stripeCustomerId);
      if (!customer.deleted) {
        return host.stripeCustomerId;
      }
    }

    // Créer un nouveau customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: host.companyName || `${user.firstName} ${user.lastName}`,
      metadata: {
        hostId: host._id.toString(),
        userId: user._id.toString()
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Erreur lors de la création du customer Stripe:', error);
    throw new Error('Erreur lors de la création du customer Stripe');
  }
};

/**
 * Créer ou récupérer un compte connecté pour un professionnel de ménage
 * @param {Object} cleaner - Objet professionnel de ménage
 * @param {Object} user - Objet utilisateur associé
 * @returns {Promise<string>} ID du compte connecté Stripe
 */
exports.createOrGetConnectedAccount = async (cleaner, user) => {
  try {
    if (cleaner.bankAccount && cleaner.bankAccount.stripeAccountId) {
      // Vérifier si le compte existe toujours
      const account = await stripe.accounts.retrieve(cleaner.bankAccount.stripeAccountId);
      if (!account.deleted) {
        return cleaner.bankAccount.stripeAccountId;
      }
    }

    // Créer un nouveau compte connecté
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: user.email,
      business_type: cleaner.businessDetails.isAutoEntrepreneur ? 'individual' : 'company',
      business_profile: {
        mcc: '7349', // Code pour services de nettoyage
        url: 'https://cleanconnect.com', // URL de la plateforme
      },
      metadata: {
        cleanerId: cleaner._id.toString(),
        userId: user._id.toString()
      }
    });

    return account.id;
  } catch (error) {
    console.error('Erreur lors de la création du compte connecté Stripe:', error);
    throw new Error('Erreur lors de la création du compte connecté Stripe');
  }
};

/**
 * Créer un lien d'onboarding pour un compte connecté Stripe
 * @param {string} accountId - ID du compte connecté Stripe
 * @param {string} refreshUrl - URL de retour en cas d'abandon
 * @param {string} returnUrl - URL de retour après complétion
 * @returns {Promise<string>} URL du lien d'onboarding
 */
exports.createAccountLink = async (accountId, refreshUrl, returnUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    return accountLink.url;
  } catch (error) {
    console.error('Erreur lors de la création du lien d\'onboarding:', error);
    throw new Error('Erreur lors de la création du lien d\'onboarding');
  }
};

/**
 * Effectuer un versement à un professionnel de ménage après une mission
 * @param {Object} booking - Objet de réservation
 * @param {string} connectedAccountId - ID du compte connecté du professionnel
 * @returns {Promise<Object>} Résultat du transfert
 */
exports.transferToCleanerAccount = async (booking, connectedAccountId) => {
  try {
    const amount = Math.round(booking.payment.cleanerPayout * 100); // Conversion en centimes
    
    // Effectuer le transfert au compte connecté
    const transfer = await stripe.transfers.create({
      amount,
      currency: booking.payment.currency || 'eur',
      destination: connectedAccountId,
      transfer_group: `BOOKING_${booking._id}`,
      metadata: {
        bookingId: booking._id.toString(),
        cleanerId: booking.cleaner.toString()
      }
    });

    return {
      success: true,
      transferId: transfer.id,
      amount: transfer.amount / 100
    };
  } catch (error) {
    console.error('Erreur lors du transfert au professionnel:', error);
    throw new Error('Erreur lors du transfert au professionnel');
  }
};

/**
 * Créer un remboursement pour un paiement capturé
 * @param {string} paymentIntentId - ID de l'intention de paiement
 * @param {number} amount - Montant à rembourser (si null, remboursement total)
 * @param {string} reason - Raison du remboursement
 * @returns {Promise<Object>} Résultat du remboursement
 */
exports.createRefund = async (paymentIntentId, amount = null, reason = 'requested_by_customer') => {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
      reason
    };

    // Si un montant est spécifié, l'ajouter (sinon remboursement total)
    if (amount) {
      refundData.amount = Math.round(amount * 100); // Conversion en centimes
    }

    const refund = await stripe.refunds.create(refundData);

    return {
      success: refund.status === 'succeeded',
      refundId: refund.id,
      amount: refund.amount / 100
    };
  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    throw new Error('Erreur lors du remboursement');
  }
};