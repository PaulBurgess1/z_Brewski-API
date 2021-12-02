const PORT = process.env.PORT || 8000;

const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios')

const app = express()


//---------------------------------------Functions
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
                    else if(temp[0] == "O"){
                        row.push("0")
                    }
                    else{
                        row.push(temp)
                    }
                });//block
                let temp = row[0].split(' ');
                let ppb = (  (row[2].slice(1)) / temp[0] ).toFixed(2) //Gets the APPX price per can
                row.push("$"+ppb);
                //Price per 100ml
                let x = (temp[0] * temp[3]) / 100;
                let ppml = (row[2].slice(1) / x ).toFixed(2);
                row.push("$"+ppml);
                //   "XX_can_XXX_ml" = 15 characters
                //    Kegs are considered bottles, for simplicity.
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


//----------------------------------------------------------Endpoints
app.get('/', (req, res) => {
    res.set("access-control-allow-origin", "*");
    res.type("json")
    res.json('Welcome To Brewski Api!')
})

//Beer store
//Always gets data from the 'Victoria Park/Finch' store.
app.get('/beerstore', async (req, res) => {
    res.set("access-control-allow-origin", "*");
    res.type("json")
    axios.get('https://www.thebeerstore.ca/beers/brava/')
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)
            let data =getBottlesAndCans($, html)
            const stock ={
                beer: "Brava",
                url: 'https://www.thebeerstore.ca/beers/brava',
                location: "Victoria Park/Finch, Toronto",
                bottles: data[1],
                cans: data[2]
            }
            res.json(stock);
        })
})
//beerstore w/ beer name
app.get('/beerstore/:beerName', async (req, res) => {
    res.set("access-control-allow-origin", "*");
    res.type("json")
    //Input fixing
    let beerName = (req.params.beerName).replace(/ /g, "-");
    beerName = beerName.replace(/'/g,"")
    beerName = beerName.replace(/\(/g,"")
    beerName = beerName.replace(/\)/g,"")
    beerName = beerName.replace(/\./g,"-")

    axios.get('https://www.thebeerstore.ca/beers/'+beerName)
        .then(response => {
            const html = response.data
            const $ = cheerio.load(html)
            let data =getBottlesAndCans($, html)
            const stock ={
                beer: beerName,
                url: 'https://www.thebeerstore.ca/beers/'+beerName,
                location: "Victoria Park/Finch, Toronto",
                bottles: data[1],
                cans: data[2]
            }
            res.json(stock);
        })
})

//------------
app.listen(PORT, () => console.log("Server running on PORT: "+PORT))