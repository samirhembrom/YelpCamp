const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');

main().catch(err => console.log(err));
main().then(res => console.log('Mongoose Server connected'));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp');

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const sample = arr => arr[Math.floor(Math.random() * arr.length)];

const seedDB = async () => {
  await Campground.deleteMany({});
  for (let i = 1; i <= 300; ++i) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 20) + 10;
    const camp = new Campground({
      author: '64de1cf7abf1eccab85197f6',
      location: `${cities[random1000].city},${cities[random1000].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
      description:
        'Lorem ipsum is placeholder text commonly used in the graphic, print, and publishing industries for previewing layouts and visual mockups.',
      price,
      geometry: { type: ['Point'], coordinates: [cities[random1000].longitude, cities[random1000].latitude] },
      images: [
        {
          url: 'https://res.cloudinary.com/diq7n1jaq/image/upload/v1693369465/YelpCamp/hhbab5xwvakob8lx9tul.jpg',
          filename: 'YelpCamp/hhbab5xwvakob8lx9tul',

        },
        {
          url: 'https://res.cloudinary.com/diq7n1jaq/image/upload/v1693369684/YelpCamp/m2zilagujblgifi6ccmn.jpg',
          filename: 'YelpCamp/m2zilagujblgifi6ccmn',

        }
      ]
    });
    await camp.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
});
