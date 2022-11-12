const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const puppeteer = require("puppeteer");

const MetaReport = require("./models/metarepost.js");

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(bodyParser.json());

app.use("/crawlmetareport", function (req, res, next) {
  (async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto("https://tftactics.gg/meta-report", {
      waitUntil: "networkidle0",
    });
    const html = await page.content();
    let data = await page.evaluate(() => {
      let metaReposts = [];

      let tier_groups = document.querySelectorAll(
        ".tierlist.teams .tier-group"
      );

      tier_groups.forEach((group) => {
        let groupData = {};
        groupData.members = [];
        groupData.name = group.querySelector(".team-name-elipsis").innerText;

        groupData.tier = group.querySelector(".team-rank").innerText;

        groupData.avg_place = group.querySelector(
          ".team-stats .team-stat:nth-child(1) span"
        ).innerText;
        groupData.win_rate = group.querySelector(
          ".team-stats .team-stat:nth-child(2) span"
        ).innerText;
        groupData.top_4 = group.querySelector(
          ".team-stats .team-stat:nth-child(3) span"
        ).innerText;
        groupData.contested = group.querySelector(
          ".team-stats .team-stat:nth-child(4)"
        ).innerText;

        let charactersItems = group.querySelectorAll(
          ".team-characters.report > .team-characters-units > .characters-item"
        );

        charactersItems.forEach((c) => {
          let member_name = c.querySelector(
            ".character-wrapper .character-icon"
          ).alt;
          let itemsEle = c.querySelectorAll(
            ".character-items .characters-item .character-icon"
          );
          let max_level =
            window.getComputedStyle(c, "::before").content === `\"★★★\"`;
          let member_items = [];
          if (itemsEle !== null) {
            itemsEle.forEach((i) => member_items.push(i.alt));
          }

          groupData.members.push({
            member_name,
            member_items,
            max_level,
          });
        });

        metaReposts.push(groupData);
      });

      return metaReposts;
    });
    await page.close();
    // save data to mongodb
    const doc = new MetaReport({
      data,
    });

    doc.save(function (err, results) {
      console.log(results._id);
      res.status(200).send("Crawl success");
    });
  })();
});

app.use("/metareport", function (req, res, next) {
  MetaReport.find().then((data) => res.status(200).json(data));
});

mongoose
  .connect(
    "mongodb+srv://khanh:1@cluster0.qisn3x3.mongodb.net/?retryWrites=true&w=majority"
  )
  .then((result) => {
    console.log("connected to mongodb");
    console.log("listening to port 8080");
    app.listen(process.env.PORT || 8080);
  })
  .catch((err) => console.log(err));
