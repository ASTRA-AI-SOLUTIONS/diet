const FOOD_DATABASE = [
  {
    id: 'f_butter_chicken',
    name: 'Murgh Makhani (Butter Chicken)',
    category: 'Indian Cuisine',
    cuisine: 'Indian',
    hindiName: 'बटर चिकन'
  }
];

const q = 'kheer';
const selectedCategory = 'All';

const filtered = FOOD_DATABASE.filter((f) => {
      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        (f.hindiName && f.hindiName.toLowerCase().includes(q)) ||
        (f.cuisine && f.cuisine.toLowerCase().includes(q)) ||
        (f.category && f.category.toLowerCase().includes(q));

      const matchCat =
        selectedCategory === 'All'
          ? true
          : selectedCategory === 'Indian Cuisine'
          ? f.category === 'Indian Cuisine' || f.cuisine === 'Indian'
          : f.category === selectedCategory;

      return matchSearch && matchCat;
    });

console.log(filtered);
