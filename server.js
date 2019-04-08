var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// morgan logger 
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/unit18Populater", { useNewUrlParser: true });

// Routes

// A GET route for scraping the  website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("http://www.nytimes.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $("article h2").each(function (i, element) {
            // Save an empty result object
            var result = {};
            const title = $(this).children('h3').children('a').children('span').text();
            const link = $(this).children('h3').children('a').attr('href');
            const summary = $(this).children('p').text();

            result.title = title;
            result.link = link;
            result.summary = summary;



            // Create a new Article 
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, log it
                    console.log(err);
                });
        });

        // Send a message to the client
        res.redirect("/articles");
    });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    //show articles
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            var articleObj = { article: dbArticle };
            res.render("index", articleObj);
            res.json(dbArticle);
        })

        .catch(function (err) {
            // If an error occurred, send it 
            res.json(err);
        });
});



// Start the server
app.listen(PORT, function () {
    console.log("Listening on port " + PORT + "!");
});
