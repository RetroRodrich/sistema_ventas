export default {
  // Esta línea le dice a Jest que ejecute tu archivo de setup antes de cada prueba.
  // Es crucial para que el mock de TextEncoder funcione.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Esta línea establece el entorno de prueba para simular un navegador.
  testEnvironment: 'jsdom',

  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(webp|png|jpg|jpeg|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  }
};