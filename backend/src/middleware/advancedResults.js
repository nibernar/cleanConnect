/**
 * Middleware pour gérer la pagination, le tri et le filtrage des résultats
 * @param {Model} model - Modèle Mongoose
 * @param {String} populate - Champs à peupler (format: 'field1,field2')
 * @returns {Function} - Middleware Express
 */
const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // Copie de req.query
  const reqQuery = { ...req.query };

  // Champs à exclure
  const removeFields = ['select', 'sort', 'page', 'limit'];

  // Suppression des champs spéciaux de reqQuery
  removeFields.forEach(param => delete reqQuery[param]);

  // Création de la chaîne de requête
  let queryStr = JSON.stringify(reqQuery);

  // Création des opérateurs ($gt, $gte, etc.)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

  // Recherche dans la base de données
  query = model.find(JSON.parse(queryStr));

  // SELECT (projection)
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }

  // SORT
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Population
  if (populate) {
    if (typeof populate === 'string') {
      query = query.populate(populate);
    } else if (Array.isArray(populate)) {
      populate.forEach(item => {
        query = query.populate(item);
      });
    }
  }

  // Exécution de la requête
  const results = await query;

  // Objet pagination
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};

module.exports = advancedResults;