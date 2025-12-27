
import { Product, Category, Unit } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Rice',
    category: 'Grains & Staples',
    supportedUnits: ['Kongo', 'Bag', 'Kg'],
    pricePerUnit: { 'Kongo': 1800, 'Bag': 48000, 'Kg': 1200 },
    stock: 500,
    adjustable: true
  },
  {
    id: '2',
    name: 'Honey Beans',
    category: 'Grains & Staples',
    supportedUnits: ['Kongo', 'Bag', 'Kg'],
    pricePerUnit: { 'Kongo': 2200, 'Bag': 55000, 'Kg': 1500 },
    stock: 300,
    adjustable: true
  },
  {
    id: '3',
    name: 'Vegetable Oil',
    category: 'Oils & Condiments',
    supportedUnits: ['5L-Bottle', '10L-Bottle', 'Kg'],
    pricePerUnit: { '5L-Bottle': 8500, '10L-Bottle': 16500, 'Kg': 1800 },
    stock: 150,
    adjustable: true
  },
  {
    id: '4',
    name: 'White Gari',
    category: 'Grains & Staples',
    supportedUnits: ['Kongo', 'Bag'],
    pricePerUnit: { 'Kongo': 900, 'Bag': 18000 },
    stock: 400,
    adjustable: true
  },
  {
    id: '5',
    name: 'Tomato Paste',
    category: 'Vegetables & Spices',
    supportedUnits: ['Carton', 'Portion'],
    pricePerUnit: { 'Carton': 12500, 'Portion': 1200 },
    stock: 100,
    adjustable: true
  },
  {
    id: '6',
    name: 'Farm Fresh Eggs',
    category: 'Eggs & Others',
    supportedUnits: ['Crate'],
    pricePerUnit: { 'Crate': 3200 },
    stock: 200,
    adjustable: true
  }
];

export const CATEGORIES: Category[] = [
  'Grains & Staples',
  'Vegetables & Spices',
  'Oils & Condiments',
  'Proteins',
  'Eggs & Others'
];
