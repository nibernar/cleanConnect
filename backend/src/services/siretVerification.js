/**
 * Service de vérification de SIRET
 * Utilise l'API publique de l'INSEE pour vérifier la validité d'un numéro SIRET
 */

const axios = require('axios');

/**
 * Vérification basique de la validité d'un numéro SIRET via l'algorithme de Luhn
 * @param {string} siret - Numéro SIRET à vérifier
 * @returns {boolean} Validité du numéro selon l'algorithme
 */
const validateSiretFormat = (siret) => {
  // Vérifier la longueur (14 chiffres)
  if (!siret || siret.length !== 14 || !/^\d+$/.test(siret)) {
    return false;
  }

  // Vérification avec l'algorithme de Luhn
  let sum = 0;
  let alternate = false;
  
  for (let i = siret.length - 1; i >= 0; i--) {
    let n = parseInt(siret.substring(i, i + 1));
    
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = (n % 10) + 1;
      }
    }
    
    sum += n;
    alternate = !alternate;
  }
  
  return (sum % 10 === 0);
};

/**
 * Vérifier l'existence d'un SIRET auprès de l'API publique de l'INSEE
 * @param {string} siret - Numéro SIRET à vérifier
 * @returns {Promise<Object>} Données de l'entreprise si SIRET valide
 */
const checkSiretWithApi = async (siret) => {
  try {
    // URL de l'API Sirene
    const url = `https://api.insee.fr/entreprises/sirene/V3/siret/${siret}`;
    
    // En environnement réel, il faudrait obtenir un token d'API
    // Pour le développement, nous simulons une réponse
    // const response = await axios.get(url, {
    //   headers: {
    //     'Authorization': `Bearer ${process.env.INSEE_API_KEY}`
    //   }
    // });
    
    // Simuler une réponse
    const isSiretValid = validateSiretFormat(siret);
    
    if (!isSiretValid) {
      throw new Error('Format de SIRET invalide');
    }
    
    // En production, return response.data;
    return {
      siret,
      etablissement: {
        uniteLegale: {
          denominationUniteLegale: 'Entreprise simulée pour développement',
          categorieJuridiqueUniteLegale: '5498',
          etatAdministratifUniteLegale: 'A' // A = Active
        },
        adresseEtablissement: {
          codeCommuneEtablissement: '75001',
          libelleCommuneEtablissement: 'PARIS'
        }
      }
    };
  } catch (error) {
    console.error(`Erreur lors de la vérification du SIRET: ${error.message}`);
    return null;
  }
};

/**
 * Vérifier la validité complète d'un SIRET (format + existence)
 * @param {string} siret - Numéro SIRET à vérifier
 * @returns {Promise<boolean>} Validité du SIRET
 */
exports.validateSiret = async (siret) => {
  // Vérifier d'abord le format avec l'algorithme de Luhn
  if (!validateSiretFormat(siret)) {
    return false;
  }
  
  // Vérifier ensuite avec l'API
  const apiResponse = await checkSiretWithApi(siret);
  return apiResponse !== null;
};

/**
 * Récupérer les informations détaillées pour un SIRET valide
 * @param {string} siret - Numéro SIRET à vérifier
 * @returns {Promise<Object|null>} Données de l'entreprise ou null si invalide
 */
exports.getSiretDetails = async (siret) => {
  if (!validateSiretFormat(siret)) {
    return null;
  }
  
  return await checkSiretWithApi(siret);
};