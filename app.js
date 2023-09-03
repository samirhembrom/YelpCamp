// if (process.env.NODE_ENV !== "production") {
//   require('dotenv').config();
// }
process.env.NODE_ENV = "production";
require('dotenv').config();

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const ExpressError = require("./utils/ExpressError");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStratergy = require("passport-local");
const User = require("./models/user");
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const userRoutes = require('./routes/users')
const campgroundsRoutes = require("./routes/campgrounds")
const reviewsRoutes = require("./routes/reviews");
const { contentSecurityPolicy } = require('helmet');
  const MongoDBStore = require('connect-mongo')(session);
const dbUrl = process.env.DB_URL || "mongodb://127.0.0.1:27017/yelp-camp";

main().catch((err) => console.log(err));
main().then((res) => console.log("Mongoose Server connected"));
async function main() {
  await mongoose.connect(dbUrl);
  //"mongodb://127.0.0.1:27017/yelp-camp"
  //await mongoose.connect(dbUrl);
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize({replaceWith: '_',}));

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = new MongoDBStore({
  url: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
  
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e)
})


const sessionConfig = {
  store,
  name: 'session',
  secret,
  resave: false,
  cookie: {
    httpOnly: true,
    //secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  },
  saveUninitialized: true
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
  "https://stackpath.bootstrapcdn.com/",
  "https://api.tiles.mapbox.com/",
  "https://api.mapbox.com/",
  "https://kit.fontawesome.com/",
  "https://cdnjs.cloudflare.com/",
  "https://cdn.jsdelivr.net",
];
//This is the array that needs added to
const styleSrcUrls = [
  "https://kit-free.fontawesome.com/",
  "https://api.mapbox.com/",
  "https://api.tiles.mapbox.com/",
  "https://fonts.googleapis.com/",
  "https://use.fontawesome.com/",
  "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
  "https://api.mapbox.com/",
  "https://a.tiles.mapbox.com/",
  "https://b.tiles.mapbox.com/",
  "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
  helmet.contentSecurityPolicy({
      directives: {
          defaultSrc: [],
          connectSrc: ["'self'", ...connectSrcUrls],
          scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
          styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
          workerSrc: ["'self'", "blob:"],
          objectSrc: [],
          imgSrc: [
              "'self'",
              "blob:",
              "data:",
              "https://res.cloudinary.com/diq7n1jaq/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
              "https://images.unsplash.com/",
          ],
          fontSrc: ["'self'", ...fontSrcUrls],
      },
  })
);


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStratergy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
})


app.get("/fakeUser", async (req, res) => {
  const user = new User({ email: 'sam@gmail.com', username: 'sam' });
  const newUser = await User.register(user, "monkey");
  res.send(newUser);
})


app.use("/", userRoutes);
app.use("/campgrounds", campgroundsRoutes);
app.use("/campgrounds/:id/reviews", reviewsRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found!", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.mesage = "Oh no something went wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server listening at post ${port}`);
});
