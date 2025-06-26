import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Añade TextEncoder y TextDecoder al objeto global para que Jest y JSDOM los reconozcan
// en todas las pruebas.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;