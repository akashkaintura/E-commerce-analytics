// tests/unit/logger.test.ts
import logger from '../../src/utils/logger';

describe('Logger Utility', () => {
    it('should log messages correctly', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        logger.info('Test log message');
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Test log message'));
        logSpy.mockRestore();
    });
});