/* Treehouse Techdegree - Full Stack Javascript
Cameron O'Brien
Project 06
Content Scraper
*/

"use strict";

// Dependencies
const   request = require('request'),
        cheerio = require('cheerio'),
        json2csv = require('json2csv'),
        moment = require("moment"),
        fs = require("fs");

// Declare variables to store data
const   siteLinks = [],     // Array to store site links
        shirtDataTotal = [];  // Array to store all shirt objects

const url = 'http://shirts4mike.com';

// request to the url
request(url, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    let $ = cheerio.load(body);

    $('a[href*="shirt"]').each(function() {
      let href = $(this).attr('href');
      let urlPath = `http://shirts4mike.com/${href}`;
      if (siteLinks.indexOf(urlPath) == -1) {
        siteLinks.push(urlPath);
        console.log("siteLinks: " , siteLinks);
      }
    });
    const shirtData = [];
    for (let i = 0; i < siteLinks.length; i++) {
      if (siteLinks[i].indexOf('?id=') > 0 ) {
        shirtData.push(siteLinks[i]);

      } else {
        request(siteLinks[i], function(error, response, body) {
          if (!error && response.statusCode == 200) {
            let $ = cheerio.load(body);
            $("a[href^='shirt.php?id=']").each(function() {
              let href = $(this).attr('href');
              let path = `http://shirts4mike.com/${href}`;
              if (shirtData.indexOf(path) == -1) {
                shirtData.push(path);
                console.log("shirtData: " , shirtData);
              }
            });
            
            for (let k = 0; k < shirtData.length; k++) {
              request(shirtData[k], function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  let $ = cheerio.load(body);
                  let title = $('title').text();
                  let price = $('.price').text();
                  let img = $('.shirt-picture img').attr('src');
                  // shirt object to store data
                  let shirts = {};
                  shirts.Title = title;
                  shirts.Price = price;
                  shirts["Image URL"] = `http://shirts4mike.com/${img}`;
                  shirts.Time = moment().format("MMMM Do YYYY, h:mm:ss a");
                  shirts.URL = response.request.uri.href;
                  
                  shirtDataTotal.push(shirts);
                  console.log("shirtData: ", shirtData);
                  console.log("shirtDataTotal: ", shirtDataTotal);
                  createCSV(shirtDataTotal);

                } else {
                  errorHandler(error);
                }
              });
            }
          } else {
            errorHandler(error);
          }
        });
      }
    }
  } else {
    errorHandler(error);
  }
});

// Create csv file and store it in '/data' directory
function createCSV(data) {
    const time = moment().format("YYYY[-]MM[-]DD");
    const dir = "./data";
    if(!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    // Headers for csv file
    const csvTitle = ['Title', 'Price', 'Image URL', 'URL', 'Time'];
    json2csv({ data: shirtDataTotal, fields: csvTitle }, function(error, csv) {
      fs.writeFile( dir + "/" + time + ".csv", csv, function(error) {
        if (error) throw error;
          console.log('File write and save complete');
      });
    });
}
     
// Function to handle and display errors
function errorHandler(error) {
  let date = new Date();
  let log = "[" + date + "] " + error.message + "\n";
  console.log('Whoops! There’s been a 404 error. Cannot connect to ' + url);
  fs.appendFile('scraper-error.log', log, function(error) {
    if (error) throw error;
    console.log('Error has been added to log');
  });
};