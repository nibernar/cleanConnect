const siretVerificationService = require('../../src/services/siretVerification');

// Mock external API call
jest.mock('axios', () => ({
  get: jest.fn()
}));

describe('SIRET Verification Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifySiret', () => {
    it('should return valid status for a valid SIRET', async () => {
      // Setup
      const validSiret = '12345678901234';
      const mockApiResponse = {
        data: {
          etablissement: {
            siret: validSiret,
            nom_raison_sociale: 'Test Company',
            etat_administratif: 'A',
            adresse: {
              numero_voie: '1',
              type_voie: 'RUE',
              libelle_voie: 'Test Street',
              code_postal: '75001',
              libelle_commune: 'Paris'
            }
          }
        }
      };

      // Mock implementation
      require('axios').get.mockResolvedValue(mockApiResponse);

      // Execute
      const result = await siretVerificationService.verifySiret(validSiret);

      // Assert
      expect(require('axios').get).toHaveBeenCalledWith(
        expect.stringContaining(validSiret)
      );
      expect(result).toEqual({
        isValid: true,
        companyInfo: {
          name: 'Test Company',
          siret: validSiret,
          status: 'active',
          address: '1 RUE Test Street, 75001 Paris'
        }
      });
    });

    it('should return invalid status for a non-existent SIRET', async () => {
      // Setup
      const invalidSiret = '00000000000000';
      
      // Mock implementation
      require('axios').get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'SIRET not found' }
        }
      });

      // Execute
      const result = await siretVerificationService.verifySiret(invalidSiret);

      // Assert
      expect(require('axios').get).toHaveBeenCalledWith(
        expect.stringContaining(invalidSiret)
      );
      expect(result).toEqual({
        isValid: false,
        error: 'SIRET not found in database'
      });
    });

    it('should return invalid status for an inactive company', async () => {
      // Setup
      const inactiveSiret = '12345678901234';
      const mockApiResponse = {
        data: {
          etablissement: {
            siret: inactiveSiret,
            nom_raison_sociale: 'Inactive Company',
            etat_administratif: 'F', // F for Fermé (closed)
            adresse: {
              numero_voie: '1',
              type_voie: 'RUE',
              libelle_voie: 'Test Street',
              code_postal: '75001',
              libelle_commune: 'Paris'
            }
          }
        }
      };

      // Mock implementation
      require('axios').get.mockResolvedValue(mockApiResponse);

      // Execute
      const result = await siretVerificationService.verifySiret(inactiveSiret);

      // Assert
      expect(require('axios').get).toHaveBeenCalledWith(
        expect.stringContaining(inactiveSiret)
      );
      expect(result).toEqual({
        isValid: false,
        error: 'Company is not active',
        companyInfo: {
          name: 'Inactive Company',
          siret: inactiveSiret,
          status: 'inactive',
          address: '1 RUE Test Street, 75001 Paris'
        }
      });
    });

    it('should handle API errors gracefully', async () => {
      // Setup
      const siret = '12345678901234';
      
      // Mock implementation
      require('axios').get.mockRejectedValue({
        message: 'Network Error'
      });

      // Execute
      const result = await siretVerificationService.verifySiret(siret);

      // Assert
      expect(require('axios').get).toHaveBeenCalledWith(
        expect.stringContaining(siret)
      );
      expect(result).toEqual({
        isValid: false,
        error: 'Error verifying SIRET: Network Error'
      });
    });

    it('should validate SIRET format before API call', async () => {
      // Setup - Invalid format (too short)
      const invalidFormatSiret = '123456';
      
      // Execute
      const result = await siretVerificationService.verifySiret(invalidFormatSiret);

      // Assert
      expect(require('axios').get).not.toHaveBeenCalled();
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid SIRET format'
      });
    });
  });
});