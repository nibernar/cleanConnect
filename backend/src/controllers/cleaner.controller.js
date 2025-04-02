const Cleaner = require('../models/Cleaner');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const { validateSiret } = require('../services/siretVerification');
const { createOrGetConnectedAccount, createAccountLink } = require('../services/payment');

// ... autres contrôleurs ...

/**
 * @desc    Verify cleaner identity (Admin)
 * @route   PUT /api/v1/cleaners/:id/verify
 * @access  Private/Admin
 */
exports.verifyCleaner = asyncHandler(async (req, res, next) => {
  // Log Entrée
  console.log(`[verifyCleaner] Attempting to verify cleaner ID: ${req.params.id} with status: ${req.body.status}`);
  
  // Vérification rôle (redondant si authorize est sur la route, mais double sécurité)
  if (req.user.role !== 'admin') {
    console.error('[verifyCleaner] Error: Not an admin.');
    return next(new ErrorResponse(`L\'utilisateur n\'a pas les droits`, 403));
  }

  const cleanerId = req.params.id;
  const newStatus = req.body.status; // 'verified' ou 'rejected'

  // Validation du statut fourni
  if (!['verified', 'rejected', 'pending'].includes(newStatus)) {
       console.error(`[verifyCleaner] Error: Invalid status provided: ${newStatus}`);
       return next(new ErrorResponse(`Statut de vérification invalide: ${newStatus}`, 400));
  }

  console.log(`[verifyCleaner] Finding cleaner with ID: ${cleanerId}`);
  const cleaner = await Cleaner.findById(cleanerId);

  if (!cleaner) {
    console.error(`[verifyCleaner] Error: Cleaner not found with ID: ${cleanerId}`);
    return next(new ErrorResponse(`Professionnel de ménage non trouvé`, 404));
  }
  console.log(`[verifyCleaner] Cleaner found. Current status: ${cleaner.verificationStatus}. User ID: ${cleaner.user}`);

  // Mettre à jour le statut de vérification du cleaner
  cleaner.verificationStatus = newStatus;
  console.log(`[verifyCleaner] Updating cleaner status to: ${newStatus}. Saving cleaner...`);
  await cleaner.save();
  console.log(`[verifyCleaner] Cleaner status saved.`);

  // Mettre à jour le statut isVerified sur le modèle User associé
  const userVerifiedStatus = (newStatus === 'verified');
  console.log(`[verifyCleaner] Updating User (${cleaner.user}) isVerified status to: ${userVerifiedStatus}`);
  const updatedUser = await User.findByIdAndUpdate(cleaner.user, { isVerified: userVerifiedStatus }, { new: true });
  
  if(!updatedUser){
       console.error(`[verifyCleaner] Error: Could not find or update User with ID: ${cleaner.user}`);
       // Que faire ici? L'état est incohérent. Renvoyer une erreur 500?
       // Pour l'instant, on continue mais on log l'erreur.
       // Peut-être annuler la sauvegarde du cleaner? (plus complexe)
  } else {
       console.log(`[verifyCleaner] User isVerified status updated.`);
  }

  // Log Final avant réponse
  console.log(`[verifyCleaner] Process completed for cleaner ID: ${cleanerId}. Sending response.`);
  res.status(200).json({
    success: true,
    data: cleaner // Renvoyer le cleaner mis à jour
  });
});


// --- Remettre les autres fonctions du contrôleur ici --- 
exports.getCleaners = asyncHandler(async (req, res, next) => { /* ... */ res.status(200).json(res.advancedResults); });
exports.getCleaner = asyncHandler(async (req, res, next) => { /* ... */ 
    const cleaner = await Cleaner.findById(req.params.id).populate({ path: 'user', select: 'firstName lastName email phone location rating profileImage' });
    if (!cleaner) { return next(new ErrorResponse(`Professionnel non trouvé`, 404)); }
    const isOwner = req.user?.id === cleaner.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) { 
        const limitedCleaner = { _id: cleaner._id, user: { firstName: cleaner.user.firstName, lastName: cleaner.user.lastName, rating: cleaner.user.rating, profileImage: cleaner.user.profileImage }, workPreferences: cleaner.workPreferences, completedJobs: cleaner.completedJobs };
        return res.status(200).json({ success: true, data: limitedCleaner });
     }
    res.status(200).json({ success: true, data: cleaner }); 
});
exports.createCleaner = asyncHandler(async (req, res, next) => { /* ... */ 
    const existingCleaner = await Cleaner.findOne({ user: req.user.id });
    if (existingCleaner) { return next(new ErrorResponse(`L\'utilisateur a déjà un profil cleaner`, 400)); }
    req.body.user = req.user.id;
    const siret = req.body.businessDetails?.siret;
    if (!siret) { return next(new ErrorResponse('Un numéro SIRET est requis', 400)); }
    const siretValidation = await validateSiret(siret);
    if (!siretValidation.isValid) { return next(new ErrorResponse(siretValidation.message || 'Numéro SIRET invalide', 400)); }
    req.body.businessDetails = { ...req.body.businessDetails, ...siretValidation.details };
    req.body.verificationStatus = 'pending';
    const cleaner = await Cleaner.create(req.body);
    await User.findByIdAndUpdate(req.user.id, { role: 'cleaner', companyName: siretValidation.details?.companyName });
    res.status(201).json({ success: true, data: cleaner }); 
});
exports.updateCleaner = asyncHandler(async (req, res, next) => { /* ... */ 
    let cleaner = await Cleaner.findById(req.params.id);
    if (!cleaner) return next(new ErrorResponse(`Professionnel non trouvé`, 404));
    if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') { return next(new ErrorResponse(`Non autorisé`, 403)); }
    const newSiret = req.body.businessDetails?.siret;
    if (newSiret && newSiret !== cleaner.businessDetails?.siret) {
        const siretValidation = await validateSiret(newSiret);
        if (!siretValidation.isValid) { return next(new ErrorResponse(siretValidation.message || 'Nouveau SIRET invalide', 400)); }
        req.body.businessDetails = { ...(cleaner.businessDetails || {}), ...(req.body.businessDetails || {}), ...siretValidation.details };
        await User.findByIdAndUpdate(cleaner.user, { companyName: siretValidation.details?.companyName });
    } else if (req.body.businessDetails && !newSiret) { delete req.body.businessDetails.siret; }
    const forbiddenUpdates = ['user', 'earnings', 'verificationStatus', 'activeBookings', 'schedule'];
    forbiddenUpdates.forEach(field => delete req.body[field]);
    cleaner = await Cleaner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: cleaner }); 
});
exports.updateMyCleanerProfile = asyncHandler(async (req, res, next) => { /* ... */ 
    const allowedFields = ['businessDetails', 'workPreferences', 'availability', 'bankAccount', 'description'];
    const fieldsToUpdate = {};
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            if (field === 'businessDetails' && req.body.businessDetails?.siret) {
                const siretValidation = await validateSiret(req.body.businessDetails.siret);
                if (!siretValidation.isValid) {
                    console.warn(`SIRET invalide fourni: ${req.body.businessDetails.siret}`);
                    fieldsToUpdate[field] = { ...(req.body.businessDetails || {}) }; delete fieldsToUpdate[field].siret;
                } else {
                    fieldsToUpdate[field] = { ...(req.body.businessDetails || {}), ...siretValidation.details };
                    await User.findByIdAndUpdate(req.user.id, { companyName: siretValidation.details?.companyName });
                }
            } else { fieldsToUpdate[field] = req.body[field]; }
        }
    }
    if (Object.keys(fieldsToUpdate).length === 0) { return next(new ErrorResponse('Aucun champ valide fourni', 400)); }
    const cleaner = await Cleaner.findOneAndUpdate({ user: req.user.id }, fieldsToUpdate, { new: true, runValidators: true });
    if (!cleaner) { return next(new ErrorResponse('Profil Cleaner non trouvé', 404)); }
    res.status(200).json({ success: true, data: cleaner }); 
});
exports.deleteCleaner = asyncHandler(async (req, res, next) => { /* ... */ 
    const cleaner = await Cleaner.findById(req.params.id);
    if (!cleaner) return next(new ErrorResponse(`Professionnel non trouvé`, 404));
    if (cleaner.user.toString() !== req.user.id && req.user.role !== 'admin') { return next(new ErrorResponse(`Non autorisé`, 403)); }
    const userId = cleaner.user;
    await cleaner.deleteOne();
    await User.findByIdAndUpdate(userId, { role: 'user', isVerified: false, companyName: undefined });
    res.status(200).json({ success: true, data: {} }); 
});
exports.setupBankAccount = asyncHandler(async (req, res, next) => { /* ... */ });
exports.getMyStats = asyncHandler(async (req, res, next) => { /* ... */ 
    console.log('\n[STATS] Entering getMyStats for user:', req.user.id); console.time('getMyStats_Total');
    if (req.user.role !== 'cleaner') { return next(new ErrorResponse(`L\'utilisateur n\'est pas un professionnel`, 403)); }
    console.time('getMyStats_FindCleaner'); const cleaner = await Cleaner.findOne({ user: req.user.id }); console.timeEnd('getMyStats_FindCleaner');
    if (!cleaner) { console.log('[STATS] Cleaner profile not found'); console.timeEnd('getMyStats_Total'); return next(new ErrorResponse(`Profil non trouvé`, 404)); }
    console.log('[STATS] Cleaner found:', cleaner._id);
    console.time('getMyStats_DBQueries');
    const [completedBookings, inProgressBookings, upcomingBookings, allRatedBookings, userProfile] = await Promise.all([
        Booking.countDocuments({ cleaner: cleaner._id, status: 'completed' }), Booking.countDocuments({ cleaner: cleaner._id, status: 'inProgress' }),
        Booking.countDocuments({ cleaner: cleaner._id, status: 'confirmed' }),
        Booking.find({ cleaner: cleaner._id, 'hostRating.rating': { $exists: true } }).select('hostRating.rating'),
        User.findById(cleaner.user).select('rating')
    ]);
    console.timeEnd('getMyStats_DBQueries'); console.log('[STATS] DB Query Results:', { completedBookings, inProgressBookings, upcomingBookings, ratedCount: allRatedBookings.length });
    console.time('getMyStats_Calculations');
    const totalRatings = allRatedBookings.length; const goodRatings = allRatedBookings.filter(b => b.hostRating.rating >= 4).length;
    const satisfactionRate = totalRatings > 0 ? (goodRatings / totalRatings) * 100 : 0;
    const totalEarnings = cleaner.earnings?.total || 0; const averageRating = userProfile?.rating || 0;
    const stats = { completedBookings, inProgressBookings, upcomingBookings, totalBookings: completedBookings + inProgressBookings + upcomingBookings, totalEarnings, satisfactionRate: satisfactionRate.toFixed(2) + '%', averageRating };
    console.timeEnd('getMyStats_Calculations'); console.log('[STATS] Calculated Stats:', stats);
    console.timeEnd('getMyStats_Total'); res.status(200).json({ success: true, data: stats });
});
exports.getCleanerStats = asyncHandler(async (req, res, next) => { /* ... */ });
exports.updateAvailability = asyncHandler(async (req, res, next) => { /* ... */ });
exports.updatePreferences = asyncHandler(async (req, res, next) => { /* ... */ });
exports.getCleanerBookings = asyncHandler(async (req, res, next) => { /* ... */ });
exports.getAvailableListings = asyncHandler(async (req, res, next) => { /* ... */ 
    console.log('\n[LISTINGS] Entering getAvailableListings for user:', req.user?.id); console.time('getAvailableListings_Total');
    if (req.user.role !== 'cleaner') { return next(new ErrorResponse(`Not a cleaner`, 403)); }
    console.time('getAvailableListings_FindCleaner'); const cleaner = await Cleaner.findOne({ user: req.user.id }); console.timeEnd('getAvailableListings_FindCleaner');
    if (!cleaner) { console.log('[LISTINGS] Cleaner profile not found'); console.timeEnd('getAvailableListings_Total'); return next(new ErrorResponse(`Profil non trouvé`, 404)); }
    console.log(`[LISTINGS] Cleaner found: ${cleaner._id}`);
    const { workPreferences } = cleaner; let query = { status: 'published', 'applications.cleaner': { $ne: cleaner._id } };
    if (workPreferences?.preferredAccommodationTypes?.length > 0) { query.accommodationType = { $in: workPreferences.preferredAccommodationTypes }; }
    console.log(`[LISTINGS] Query criteria:`, JSON.stringify(query));
    let limit = parseInt(req.query.limit) || 10;
    console.time('getAvailableListings_FindListings');
    const availableListings = await Listing.find(query).sort({ createdAt: -1 }).limit(limit).populate({ path: 'host', select: 'user', populate: { path: 'user', select: 'firstName lastName rating' } }).select('title accommodationType location dateRequired area price status createdAt');
    console.timeEnd('getAvailableListings_FindListings');
    console.log(`[LISTINGS] Found ${availableListings.length} listings.`);
    console.timeEnd('getAvailableListings_Total'); res.status(200).json({ success: true, count: availableListings.length, data: availableListings });
});
// Fin des autres fonctions
