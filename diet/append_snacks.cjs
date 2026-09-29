const fs = require('fs');

const snacksAndSupplements = [
  // Packaged Snacks
  { name: "Lay's Magic Masala", category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 544, protein: 7, carbs: 54, fats: 34, fiber: 4 },
  { name: 'Kurkure Masala Munch', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 554, protein: 6, carbs: 55, fats: 35, fiber: 2 },
  { name: "Haldiram's Aloo Bhujia", category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 602, protein: 11, carbs: 41, fats: 44, fiber: 3 },
  { name: "Haldiram's Moong Dal", category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 461, protein: 21, carbs: 48, fats: 20, fiber: 5 },
  { name: 'Bingo Mad Angles', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 545, protein: 6, carbs: 59, fats: 31, fiber: 3 },
  { name: 'Uncle Chipps Spicy Treat', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 536, protein: 7, carbs: 51, fats: 34, fiber: 4 },
  { name: 'Maggi 2-Minute Noodles', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 427, protein: 8, carbs: 60, fats: 16, fiber: 2 },
  { name: 'Sunfeast Yippee Noodles', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 462, protein: 9, carbs: 62, fats: 19, fiber: 2 },
  { name: 'Parle-G Biscuits', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 450, protein: 6.5, carbs: 78, fats: 12.5, fiber: 1.5 },
  { name: 'Britannia Good Day (Cashew)', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 520, protein: 7, carbs: 66, fats: 25, fiber: 2 },
  { name: 'Britannia Bourbon', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 488, protein: 5, carbs: 71, fats: 20, fiber: 2 },
  { name: 'Britannia NutriChoice (Digestive)', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 480, protein: 7, carbs: 66, fats: 21, fiber: 6 },
  { name: 'Oreo (Original)', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 480, protein: 5, carbs: 70, fats: 20, fiber: 2.5 },
  { name: 'Bikano Navratan Mixture', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 560, protein: 12, carbs: 45, fats: 38, fiber: 4 },
  { name: "Balaji Wafers (Masala)", category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 540, protein: 6, carbs: 55, fats: 33, fiber: 3 },
  { name: 'Nutrella Soya Chunks (Raw)', category: 'Protein', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 345, protein: 52, carbs: 33, fats: 0.5, fiber: 13 },

  // Protein & Health Supplements
  { name: 'MuscleBlaze Biozyme Performance Whey', category: 'Protein', cuisine: 'Global', servingSize: 36, servingUnit: 'g (1 scoop)', calories: 130, protein: 25, carbs: 3.5, fats: 1.8, fiber: 0 },
  { name: 'Optimum Nutrition (ON) Gold Standard 100% Whey', category: 'Protein', cuisine: 'Global', servingSize: 30.4, servingUnit: 'g (1 scoop)', calories: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0 },
  { name: 'Myprotein Impact Whey', category: 'Protein', cuisine: 'Global', servingSize: 25, servingUnit: 'g (1 scoop)', calories: 103, protein: 21, carbs: 1, fats: 1.9, fiber: 0 },
  { name: 'Asitis Nutrition Whey Protein Concentrate 80%', category: 'Protein', cuisine: 'Global', servingSize: 30, servingUnit: 'g (1 scoop)', calories: 119, protein: 24, carbs: 2.5, fats: 1.5, fiber: 0 },
  { name: 'Nakpro Platinum Whey Isolate', category: 'Protein', cuisine: 'Global', servingSize: 33, servingUnit: 'g (1 scoop)', calories: 124, protein: 28, carbs: 1, fats: 0.5, fiber: 0 },
  { name: 'Horlicks (Classic Malt)', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 377, protein: 11, carbs: 79, fats: 2, fiber: 0 },
  { name: 'Bournvita', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 389, protein: 7, carbs: 85, fats: 1.8, fiber: 0 },
  { name: 'Complan (Kesar Badam)', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 419, protein: 18, carbs: 62, fats: 11, fiber: 0 },
  { name: 'Ensure (Vanilla)', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'g', calories: 423, protein: 15, carbs: 62, fats: 13, fiber: 4 },

  // Cold Drinks & Beverages
  { name: 'Thums Up', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 40, protein: 0, carbs: 10, fats: 0, fiber: 0 },
  { name: 'Limca', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 44, protein: 0, carbs: 11, fats: 0, fiber: 0 },
  { name: 'Maaza', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 60, protein: 0, carbs: 15, fats: 0, fiber: 0 },
  { name: 'Frooti', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 65, protein: 0, carbs: 16.2, fats: 0, fiber: 0 },
  { name: 'Sprite', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 48, protein: 0, carbs: 12, fats: 0, fiber: 0 },
  { name: 'Coca-Cola', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 44, protein: 0, carbs: 11, fats: 0, fiber: 0 },
  { name: 'Pepsi', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 43, protein: 0, carbs: 10.9, fats: 0, fiber: 0 },
  { name: 'Mountain Dew', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 49, protein: 0, carbs: 12.3, fats: 0, fiber: 0 },
  { name: 'Red Bull Energy Drink', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 45, protein: 0, carbs: 11, fats: 0, fiber: 0 },
  { name: 'Sting Energy Drink', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 28, protein: 0, carbs: 7, fats: 0, fiber: 0 },
  { name: 'Paper Boat Aamras', category: 'Snacks', cuisine: 'Indian', servingSize: 100, servingUnit: 'ml', calories: 55, protein: 0, carbs: 13.8, fats: 0, fiber: 0 },
  { name: 'Real Mixed Fruit Juice', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 56, protein: 0.1, carbs: 14, fats: 0, fiber: 0 },
  { name: 'Tropicana 100% Orange Juice', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 45, protein: 0.7, carbs: 10, fats: 0, fiber: 0 },
  { name: 'Gatorade (Blue Bolt)', category: 'Snacks', cuisine: 'Global', servingSize: 100, servingUnit: 'ml', calories: 24, protein: 0, carbs: 6, fats: 0, fiber: 0 },
  { name: 'Amul Kool (Kesar)', category: 'Dairy', cuisine: 'Indian', servingSize: 100, servingUnit: 'ml', calories: 95, protein: 3, carbs: 14, fats: 3, fiber: 0 }
];

const formatted = snacksAndSupplements.map((f, i) => {
  return `  {
    id: 'f_pck_${i}',
    name: '${f.name}',
    category: '${f.category}',
    cuisine: '${f.cuisine}',
    servingSize: ${f.servingSize},
    servingUnit: '${f.servingUnit}',
    calories: ${f.calories},
    protein: ${f.protein},
    carbs: ${f.carbs},
    fats: ${f.fats},
    fiber: ${f.fiber},
  }`;
}).join(',\n');

const outPath = 'src/data/foodDatabase.ts';
let content = fs.readFileSync(outPath, 'utf8');

const targetStr = `  {
    id: 'f_tandoori_roti',`;
    
if (content.includes(targetStr)) {
  content = content.replace(targetStr, formatted + ',\n' + targetStr);
  fs.writeFileSync(outPath, content);
  console.log('Successfully injected Indian snacks and beverages database.');
} else {
  console.error('Target string not found for injection.');
}
