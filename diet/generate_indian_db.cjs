const fs = require('fs');

const indianFoods = [
  { name: 'Roti / Phulka', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (30g)', calories: 85, protein: 3, carbs: 17, fats: 0.4, fiber: 2 },
  { name: 'Chapati (with oil/ghee)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (40g)', calories: 120, protein: 3.5, carbs: 18, fats: 3.5, fiber: 2 },
  { name: 'Plain Paratha', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (50g)', calories: 150, protein: 4, carbs: 22, fats: 5, fiber: 2.5 },
  { name: 'Aloo Paratha', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (150g)', calories: 260, protein: 6, carbs: 38, fats: 9, fiber: 4 },
  { name: 'Paneer Paratha', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (150g)', calories: 290, protein: 11, carbs: 35, fats: 11, fiber: 3 },
  { name: 'Gobi Paratha', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (150g)', calories: 240, protein: 7, carbs: 36, fats: 8, fiber: 5 },
  { name: 'Puri / Poori', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (30g)', calories: 101, protein: 2, carbs: 11, fats: 5, fiber: 1 },
  { name: 'Bhatura', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (60g)', calories: 180, protein: 4, carbs: 23, fats: 8, fiber: 1 },
  { name: 'Naan (Butter)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (90g)', calories: 280, protein: 7, carbs: 42, fats: 9, fiber: 2 },
  { name: 'Naan (Garlic)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (90g)', calories: 260, protein: 7, carbs: 42, fats: 6, fiber: 2 },
  
  { name: 'White Rice (Cooked)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4 },
  { name: 'Brown Rice (Cooked)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 111, protein: 2.6, carbs: 23, fats: 0.9, fiber: 1.8 },
  { name: 'Jeera Rice', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 150, protein: 3, carbs: 28, fats: 2.5, fiber: 1 },
  { name: 'Veg Pulao', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 210, protein: 4, carbs: 35, fats: 5, fiber: 3 },
  { name: 'Chicken Biryani', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 200, servingUnit: 'g', calories: 350, protein: 18, carbs: 40, fats: 12, fiber: 2 },
  { name: 'Mutton Biryani', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 200, servingUnit: 'g', calories: 400, protein: 20, carbs: 42, fats: 16, fiber: 2 },
  { name: 'Veg Biryani', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 200, servingUnit: 'g', calories: 280, protein: 6, carbs: 45, fats: 8, fiber: 4 },
  { name: 'Curd Rice', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 190, protein: 5, carbs: 25, fats: 7, fiber: 1 },
  { name: 'Khichdi (Moong Dal)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 200, servingUnit: 'g', calories: 220, protein: 8, carbs: 35, fats: 5, fiber: 5 },
  
  { name: 'Yellow Dal Tadka', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g (1 bowl)', calories: 160, protein: 9, carbs: 20, fats: 5, fiber: 6 },
  { name: 'Dal Makhani', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g (1 bowl)', calories: 220, protein: 10, carbs: 22, fats: 10, fiber: 8 },
  { name: 'Rajma Masala', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g (1 bowl)', calories: 180, protein: 8, carbs: 24, fats: 5, fiber: 7 },
  { name: 'Chole Masala / Chana Masala', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g (1 bowl)', calories: 210, protein: 9, carbs: 28, fats: 7, fiber: 8 },
  { name: 'Sambar', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g (1 bowl)', calories: 110, protein: 4, carbs: 16, fats: 3, fiber: 3 },
  { name: 'Kadhi Pakora', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g (1 bowl)', calories: 190, protein: 7, carbs: 18, fats: 10, fiber: 2 },
  
  { name: 'Paneer Butter Masala', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 310, protein: 12, carbs: 10, fats: 24, fiber: 2 },
  { name: 'Palak Paneer', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 220, protein: 11, carbs: 8, fats: 16, fiber: 4 },
  { name: 'Matar Paneer', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 240, protein: 11, carbs: 12, fats: 17, fiber: 3 },
  { name: 'Shahi Paneer', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 330, protein: 12, carbs: 12, fats: 26, fiber: 2 },
  { name: 'Paneer Bhurji', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 210, protein: 14, carbs: 5, fats: 15, fiber: 1 },
  { name: 'Malai Kofta', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 350, protein: 8, carbs: 25, fats: 24, fiber: 3 },
  { name: 'Mix Veg Curry', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 150, protein: 4, carbs: 18, fats: 7, fiber: 5 },
  { name: 'Bhindi Masala (Okra)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 110, protein: 3, carbs: 12, fats: 6, fiber: 4 },
  { name: 'Aloo Gobi', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 140, protein: 4, carbs: 18, fats: 6, fiber: 5 },
  { name: 'Aloo Matar', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 160, protein: 4, carbs: 22, fats: 6, fiber: 4 },
  { name: 'Baingan Bharta', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 120, protein: 3, carbs: 14, fats: 6, fiber: 6 },
  { name: 'Dum Aloo', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 190, protein: 4, carbs: 25, fats: 8, fiber: 3 },
  { name: 'Chana Dal', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 170, protein: 9, carbs: 26, fats: 4, fiber: 7 },

  { name: 'Chicken Curry (Homestyle)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 220, protein: 20, carbs: 8, fats: 12, fiber: 1 },
  { name: 'Butter Chicken', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 330, protein: 18, carbs: 10, fats: 24, fiber: 1 },
  { name: 'Chicken Tikka Masala', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 280, protein: 19, carbs: 12, fats: 17, fiber: 2 },
  { name: 'Tandoori Chicken', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g (approx 1 leg/breast)', calories: 210, protein: 26, carbs: 3, fats: 10, fiber: 0 },
  { name: 'Mutton Curry', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 270, protein: 22, carbs: 6, fats: 17, fiber: 1 },
  { name: 'Mutton Rogan Josh', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 290, protein: 22, carbs: 8, fats: 19, fiber: 1 },
  { name: 'Fish Curry', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 200, protein: 18, carbs: 6, fats: 11, fiber: 1 },
  { name: 'Egg Curry (2 Eggs)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 240, protein: 14, carbs: 10, fats: 16, fiber: 2 },
  
  { name: 'Idli', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (40g)', calories: 60, protein: 2, carbs: 12, fats: 0.2, fiber: 1 },
  { name: 'Plain Dosa', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (80g)', calories: 130, protein: 3, carbs: 24, fats: 2, fiber: 1 },
  { name: 'Masala Dosa', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (150g)', calories: 280, protein: 6, carbs: 45, fats: 9, fiber: 4 },
  { name: 'Medu Vada', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (50g)', calories: 150, protein: 4, carbs: 15, fats: 8, fiber: 2 },
  { name: 'Upma', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 200, protein: 5, carbs: 30, fats: 6, fiber: 3 },
  { name: 'Poha', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'g', calories: 220, protein: 4, carbs: 35, fats: 7, fiber: 2 },
  { name: 'Besan Chilla', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (60g)', calories: 110, protein: 5, carbs: 12, fats: 4, fiber: 2 },
  { name: 'Moong Dal Chilla', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (60g)', calories: 100, protein: 6, carbs: 14, fats: 2, fiber: 2 },
  
  { name: 'Samosa', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (90g)', calories: 250, protein: 4, carbs: 28, fats: 14, fiber: 2 },
  { name: 'Kachori', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (80g)', calories: 290, protein: 5, carbs: 25, fats: 18, fiber: 3 },
  { name: 'Pav Bhaji', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'plate (2 pavs + bhaji)', calories: 400, protein: 10, carbs: 55, fats: 16, fiber: 8 },
  { name: 'Vada Pav', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece', calories: 280, protein: 6, carbs: 35, fats: 12, fiber: 3 },
  { name: 'Pani Puri / Golgappa', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 6, servingUnit: 'pieces', calories: 150, protein: 3, carbs: 24, fats: 4, fiber: 2 },
  { name: 'Bhel Puri', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 200, protein: 4, carbs: 38, fats: 3, fiber: 3 },
  { name: 'Aloo Tikki', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (60g)', calories: 160, protein: 2, carbs: 22, fats: 7, fiber: 2 },
  { name: 'Dhokla (Khaman)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 150, protein: 5, carbs: 22, fats: 4, fiber: 2 },
  
  { name: 'Gulab Jamun', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (40g)', calories: 150, protein: 2, carbs: 22, fats: 6, fiber: 0 },
  { name: 'Rasgulla', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (40g)', calories: 110, protein: 2, carbs: 25, fats: 1, fiber: 0 },
  { name: 'Kheer (Rice Pudding)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 140, protein: 4, carbs: 20, fats: 5, fiber: 0.5 },
  { name: 'Gajar Ka Halwa', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 100, servingUnit: 'g', calories: 280, protein: 5, carbs: 32, fats: 15, fiber: 2 },
  { name: 'Jalebi', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 50, servingUnit: 'g', calories: 190, protein: 1, carbs: 35, fats: 5, fiber: 0 },
  { name: 'Rasmalai', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (60g)', calories: 160, protein: 4, carbs: 18, fats: 8, fiber: 0 },
  { name: 'Ladoo (Besan/Motichoor)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (40g)', calories: 180, protein: 3, carbs: 24, fats: 8, fiber: 1 },
  { name: 'Barfi (Kaju/Mawa)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 1, servingUnit: 'piece (30g)', calories: 140, protein: 3, carbs: 16, fats: 7, fiber: 0.5 },
  
  { name: 'Tea / Chai (with milk & sugar)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'ml (1 cup)', calories: 70, protein: 2, carbs: 12, fats: 2, fiber: 0 },
  { name: 'Coffee (with milk & sugar)', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'ml (1 cup)', calories: 80, protein: 2.5, carbs: 13, fats: 2.5, fiber: 0 },
  { name: 'Sweet Lassi', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 250, servingUnit: 'ml', calories: 220, protein: 7, carbs: 35, fats: 6, fiber: 0 },
  { name: 'Salted Lassi / Chaas', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 250, servingUnit: 'ml', calories: 80, protein: 4, carbs: 6, fats: 4, fiber: 0 },
  { name: 'Filter Coffee', category: 'Indian Cuisine', cuisine: 'Indian', servingSize: 150, servingUnit: 'ml', calories: 90, protein: 3, carbs: 12, fats: 3, fiber: 0 },
];

const formatted = indianFoods.map((f, i) => {
  return `  {
    id: 'f_ind_${i}',
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

// Insert at the end of FOOD_DATABASE array
const targetStr = `  {
    id: 'f_tandoori_roti',`;
    
if (content.includes(targetStr)) {
  content = content.replace(targetStr, formatted + ',\n' + targetStr);
  fs.writeFileSync(outPath, content);
  console.log('Successfully injected massive Indian foods database.');
} else {
  console.error('Target string not found for injection.');
}
