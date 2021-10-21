const PORT = 8000;

const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
let c_ip=""

const app = express()
//const CLIENT_IP=
/*
const getIP=()=>{
    axios.get("https://geolocation-db.com/json/")
    .then((response) =>{
        c_ip=response.data.IPv4;
    })
}
*/

const getBottlesAndCans=($, html) => {
        //Default Location is "Victoria Park/Finch - 2km" in Toronto
        const location = $('span[id=cr_s_n]').text();
        const bottles=[];
        const cans =[];
        //Gets all the stock of both bottles and cans
        $("li[class='d-column d-row option _cart']", html).each(function () {
            const row =[]
            $(this).each(function(i, item){
                $('span[class=mobLabel]', item).remove();
                $("div", item).each(function(j, block){
                    const temp = ($(block).text().replace(/ {4}|[\t\n]/gm,''))
                    if (temp[0] == "P"){
                        row.push("Packup")
                    }
                    else{
                        row.push(temp)
                    }
                    
                    
                });//block
                let ppb = (  (row[2].slice(1)) / row[0].split(' ')[0] ).toFixed(2) //Gets the APPX price per can
                row.push("$"+ppb);
                //   "XX_can_XXX_ml" = 15 characters
                if(row[0].length > 15){
                    bottles.push(row)
                }
                else{
                    cans.push(row)
                }
                
            });//item
            
        });//html
        return [location, bottles, cans]
  }

app.get('/', (req, res) => {
    res.json('Welcome To Brewski Api!')
})


//Brava was chosen as the default beer.
app.get('/beer', async (req, res) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.thebeerstore.ca/beers/brava/');

    //needs to wait for page to load in the stores stock otherwise you get the Victoria Park/Finch store by default.
    try {
        await Promise.all([
        page.waitForNavigation(), // The promise resolves after navigation has finished
        page.click("#cst_header_locator > div.locator_popup.locator_popupSec.dropdown-menu > div.onload-location-pop > div.cst_location_block.first_block > div.loc-block-header > button")
      ]);
    } catch (error) {
        console.log("button click error")
    }
    
    const html = await page.content();
    await browser.close();
    const $ =cheerio.load(html);
    let data =getBottlesAndCans($, html)
    const stock ={
        beer: "Brava",
        location: data[0],
        bottles: data[1],
        cans: data[2]
    }
    res.json(stock);

})//    /beer

//
app.get('/beer/:beerName', async (req, res) => {
    const beerName = (req.params.beerName).replace(/ /g, "-");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.thebeerstore.ca/beers/'+beerName);

    //needs to wait for page to load in the stores stock otherwise you get the Victoria Park/Finch store by default.
    try {
        await Promise.all([
        page.waitForNavigation(), // The promise resolves after navigation has finished
        page.click("#cst_header_locator > div.locator_popup.locator_popupSec.dropdown-menu > div.onload-location-pop > div.cst_location_block.first_block > div.loc-block-header > button")
      ]);
    } catch (error) {
        console.log("button click error")
    }
    
    
    const html = await page.content();
    await browser.close();
    const $ =cheerio.load(html);
    let data =getBottlesAndCans($, html)
    const stock ={
        beer: beerName,
        location: data[0],
        bottles: data[1],
        cans: data[2]
    }
    res.json(stock);


})

app.listen(PORT, () => console.log("Server running on PORT: "+PORT))