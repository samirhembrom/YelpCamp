const mongoose = require('mongoose');
const Review = require('./review');
const { campGroundSchema } = require('../schemas');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
  return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true}};

const CampGroundSchema = new Schema({
  title: String,
  images: [ImageSchema],
  price: Number,
  description: String,
  geometry: {
    type: {
      type: [String],
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  location: String,
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
}, opts);

CampGroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `
  <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
  <p>${this.description.substring(0,20)}...</p>`;
});

CampGroundSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews
      }
    })
  }
})

module.exports = mongoose.model('Campground', CampGroundSchema);
