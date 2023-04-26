// Full page

import puppeteer from "puppeteer";
import fs from "fs";

const EMAIL = "<your username>";
const PASSWORD = "<your password>";

const SELECTORS = {
  login: "#login-link",
  email: '[data-testid="email"]',
  password: '[data-testid="current-password"]',
  submit: '[data-testid="submit"]',
  filters: '[data-testid="AdaptiveFilterButton"]',
  images: ".avatar.avatar--large.avatar--person:not(.avatar--noPhoto)",
};

const init = async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();
  await page.goto("https://www.meetup.com", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForSelector(SELECTORS.login);
  await page.click(SELECTORS.login);

  await page.waitForSelector(SELECTORS.email);
  await page.type(SELECTORS.email, EMAIL);
  await page.type(SELECTORS.password, PASSWORD);
  await page.click(SELECTORS.submit);

  await page.waitForSelector(SELECTORS.filters);

  await page.goto("https://www.meetup.com/fedsa-community/members/?sort=joined", {
    waitUntil: "domcontentloaded"
  });

  await page.waitForSelector(SELECTORS.images);

  const waitTime = () =>
    new Promise((resolve) => {
      page.mouse.wheel({ deltaY: 300 });
      setTimeout(resolve, 200);
    });

  const handleLoadMore = async () => {
    try {
      await page.$(".infiniteScrollLoadMoreButton");
      await page.click(".infiniteScrollLoadMoreButton");
    } catch (err) {}
  };

  let count = 0;

  const wait = async () => {
    count += 1;
    await waitTime();
    await handleLoadMore();

    if (count < 30) await wait();
  };

  await wait();

  const response = await page.evaluate(() => {
    const nodes = document.querySelectorAll(
      ".avatar.avatar--large.avatar--person:not(.avatar--noPhoto)"
    );

    return Array.from(nodes).map((node) => {
      const img = node.querySelector("img").getAttribute('src');
      return { img };
    });

    // return Array.from(nodes).map((node) => node.src);
  });

  console.log(response);

  fs.writeFileSync(
    "./results.json",
    JSON.stringify({ members: response }, null, 2)
  );

  page.close();
};

init();