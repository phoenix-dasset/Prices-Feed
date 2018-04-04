var ws = require('ws');
var ws = new ws("wss://api.dassetx.com/WSGateway/");
var _ = require('lodash');
var CronJob = require('cron').CronJob
var Botkit = require('botkit');
var config = require('./config.json');
var fs = require('fs');
var prices = require("./pricestore.json");
var key = ['BTCNZD','ETHNZD','ETHBTC', 'XRPBTC', 'XRPNZD', 'LTCNZD', 'LTCBTC', 'BCHNZD', 'EOSNZD'];
// var crypto_array = ["BTCNZD", "ETHNZD", "ETHBTC", "XRPBTC", "XRPNZD", "LTCNZD", "LTCBTC"];
// if (!config.CLIENT_ID || !config.CLIENT_SECRET || !config.PORT || !config.VERIFICATION_TOKEN) {
//     console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN and PORT in environment');
//     process.exit(1);
// }
// var configBot = {};
// if (process.env.MONGOLAB_URI) {
//     var BotkitStorage = require('botkit-storage-mongo');
//     configBot = {
//         storage: BotkitStorage({ mongoUri: process.env.MONGOLAB_URI }),
//     };
// }
// var controller = Botkit.slackbot(configBot).configureSlackApp({
//     clientId: config.CLIENT_ID,
//     clientSecret: config.CLIENT_SECRET,
//     verificationToken: config.VERIFICATION_TOKEN,
//     scopes: ['commands'],
// });
// controller.setupWebserver(config.PORT, function (err, webserver) {
//     controller.createWebhookEndpoints(controller.webserver);
//     controller.createOauthEndpoints(controller.webserver, function (err, req, res) {
//         if (err) {
//             res.status(500).send('ERROR: ' + err);
//         }
//         else {
//             res.send('Success!');
//         }
//     });
// });
// var bot = controller.spawn({
//     incoming_webhook: {
//         url: config.URL
//     }
// })
ws.onopen = function () {
    for (i = 1; i < 10; i++) {
        var historyFrame = {
            "m": 0,
            "i": 0,
            "n": "SubscribeLevel1",
            "o": ""
        };
        var historyPayload = {
            "OMSId": 1, //OMS Identifier [Integer] Always 1
            "InstrumentId": i //Instrument's Identifer [Integer]
        };
        historyFrame.o = JSON.stringify(historyPayload);
        ws.send(JSON.stringify(historyFrame));
    }
}
ws.onmessage = function (evt) {
    var frame = JSON.parse(evt.data);
    var data = JSON.parse(frame.o);
    if (frame.n == 'SubscribeLevel1') {
        if(data.InstrumentId == 1 || data.InstrumentId == 2 || data.InstrumentId == 5 ||data.InstrumentId == 6 ||data.InstrumentId == 8 ||data.InstrumentId == 9){
            prices[data.InstrumentId] = ((data.BestBid + data.BestOffer) / 2 ).toFixed(2);
            fs.writeFile("pricestore.json", JSON.stringify(prices), 'utf8', function (err) {
                if (err) {
                    return console.log(err);
                }
            
                console.log("Initial load values saved.");
            }); 
        }else{
            prices[data.InstrumentId] = ((data.BestBid + data.BestOffer) / 2 ).toFixed(8);
            fs.writeFile("pricestore.json", JSON.stringify(prices), 'utf8', function (err) {
                if (err) {
                    return console.log(err);
                }
            
                console.log("Initial load values saved.");
            }); 
        }
    }
    if (frame.n == 'Level1UpdateEvent') {
        if(data.InstrumentId == 1 || data.InstrumentId == 2 || data.InstrumentId == 5 ||data.InstrumentId == 6 ||data.InstrumentId == 8 ||data.InstrumentId == 9){
            if(prices[data.InstrumentId] != ((data.BestBid + data.BestOffer) / 2 )){
                if(prices[data.InstrumentId] * 1.02 < ((data.BestBid + data.BestOffer) / 2 )){
                    //nzdIncrease(data,((data.BestBid + data.BestOffer) / 2 ).toFixed(2));
                }else if(prices[data.InstrumentId] * 0.92 > ((data.BestBid + data.BestOffer) / 2 )){
                    //nzdDecrease(data,((data.BestBid + data.BestOffer) / 2 ).toFixed(2));
                } 
            }
        }else{
            if(prices[data.InstrumentId] != ((data.BestBid + data.BestOffer) / 2 )){
                if(prices[data.InstrumentId] * 1.02 < ((data.BestBid + data.BestOffer) / 2 )){
                    //btcIncrease(((data.BestBid + data.BestOffer) / 2 ).toFixed(8));
                }else if(prices[data.InstrumentId] * 0.92 > ((data.BestBid + data.BestOffer) / 2 )){
                    //btcDecrease(((data.BestBid + data.BestOffer) / 2 ).toFixed(8));
                } 
            }
        }
    }

    function nzdIncrease(change){
        console.log("The price of " + key[data.InstrumentId - 1] + " has gone up by " + (1-prices[data.InstrumentId] / change).toFixed(2) + "% from $" + prices[data.InstrumentId]  + " to $" + change);
        prices[data.InstrumentId] = change;
        fs.writeFile("pricestore.json", JSON.stringify(prices), 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
    }

    function nzdDecrease(change){
        console.log("The price of " + key[data.InstrumentId - 1] + " has gone down by " + (1-prices[data.InstrumentId] / change).toFixed(2) + "% from $" + prices[data.InstrumentId]  + " to $" + change);
        prices[data.InstrumentId] = change;
    
        fs.writeFile("pricestore.json", JSON.stringify(prices), 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
    }

    function btcIncrease(data, change){
        console.log("The price of " + key[data.InstrumentId - 1] + " has gone up by " + (1-prices[data.InstrumentId] / change).toFixed(2) + "% from " + prices[data.InstrumentId]  + " to " + change + "BTC");
        prices[data.InstrumentId] = change;
        fs.writeFile("pricestore.json", JSON.stringify(prices), 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
    }

    function btcDecrease(change){
        console.log("The price of " + key[data.InstrumentId - 1] + " has gone down by " + (prices[data.InstrumentId] / change).toFixed(2) + "% from " + prices[data.InstrumentId]  + "BTC to " + change + "BTC");
        prices[data.InstrumentId] = change;
        fs.writeFile("pricestore.json", JSON.stringify(prices), 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
    }

}



function byTheGods(incoming) {
    if (incoming.InstrumentId == 1 || incoming.InstrumentId == 2 || incoming.InstrumentId == 5 || incoming.InstrumentId == 6) {
    //console.log(crypto_array[incoming.InstrumentId - 1] + " Bid: $" + incoming.BestBid.toFixed(2) + " Ask: $" + incoming.BestOffer.toFixed(2) + " Average: $" + ((incoming.BestBid + incoming.BestOffer) / 2).toFixed(2));
            bot.sendWebhook({
                text: (crypto_array[incoming.InstrumentId - 1] + " Bid: $" + incoming.BestBid.toFixed(2) + " Ask: $" + incoming.BestOffer.toFixed(2) + " Average: $" + ((incoming.BestBid + incoming.BestOffer) / 2).toFixed(2)),
                channel: '#price-alerts',
            }, function (err, res) {
                if (err) {
                    // ...
                }
            });
        
        //else{
        //     console.log(crypto_array[incoming.InstrumentId - 1] + " Bid: " + incoming.BestBid.toFixed(8) + "BTC " + " Ask: " + incoming.BestOffer.toFixed(8)+ "BTC " + " Average: " + ((incoming.BestBid + incoming.BestOffer)/2).toFixed(2) + "BTC");
        // }
        // var historyFrame = {
        //     "m": 0,
        //     "i": 0,
        //     "n": "UnsubscribeLevel1",
        //     "o": ""
        // };
        // var requestHistory = {
        //     "OMSId": 1, //OMS Identifier [Integer] Always 1
        //     "InstrumentId": incoming.InstrumentId //Instrument's Identifer [Integer]
        // };
        // historyFrame.o = JSON.stringify(requestHistory);
        // WebSocket.send(JSON.stringify(historyFrame)); 
    }
}


// const cronJob = new CronJob(
//     '00 00 */4 * * *',
//     main,
//     console.log('Job completed: ' + new Date()),
//     true)

// cronJob.start()
// console.log('CronJob Status:', cronJob.running);




// if(incoming.InstrumentId == 3 || incoming.InstrumentId == 4 || incoming.InstrumentId == 7){
//     bot.sendWebhook({
//         text: (crypto_array[incoming.InstrumentId - 1] + " Bid: " + incoming.BestBid.toFixed(8) + "BTC " + " Ask: " + incoming.BestOffer.toFixed(8)+ "BTC ")
//         ,
//         channel: '#price-alerts',
//     },function(err,res) {
//         if (err) {
//         // ...
//         }
//     });
// }else{
//     bot.sendWebhook({
//         text: (crypto_array[incoming.InstrumentId - 1] + " Bid: $" + incoming.BestBid.toFixed(2) + " Ask: $" + incoming.BestOffer.toFixed(2))
//         ,
//         channel: '#price-alerts',
//     },function(err,res) {
//         if (err) {
//         // ...
//         }
//     });
// }


// function byTheGods(incoming){
//     if(incoming.InstrumentId == 3 || incoming.InstrumentId == 4 || incoming.InstrumentId == 7){
//         if(storage[incoming.InstrumentId].BestBid != incoming.BestBid){
//             if(storage[incoming.InstrumentId].BestBid > incoming.BestBid){
//                 bot.sendWebhook({
//                     text: ("The best bid for " + crypto_array[incoming.InstrumentId - 1] + " has dropped by " + (storage[incoming.InstrumentId].BestBid - incoming.BestBid).toFixed(8) + "BTC from " + storage[incoming.InstrumentId].BestBid.toFixed(8) + "BTC to " + incoming.BestBid.toFixed(8) + "BTC")
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });
//             }else{
//                 bot.sendWebhook({
//                     text: ("The best bid for " + crypto_array[incoming.InstrumentId - 1] + " has increased by " + (incoming.BestBid - storage[incoming.InstrumentId.BestBid]).toFixed(8) + "BTC from " + storage[incoming.InstrumentId].BestBid.toFixed(8) + "BTC to " + incoming.BestBid.toFixed(8) + "BTC")
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });
//             }
//         }
//         if(storage[incoming.InstrumentId].BestOffer != incoming.BestOffer){
//             if(storage[incoming.InstrumentId].BestOffer > incoming.BestOffer){
//                 bot.sendWebhook({
//                     text: ("The best offer for " + crypto_array[incoming.InstrumentId - 1] + " has dropped by " + (storage[incoming.InstrumentId].BestOffer - incoming.BestOffer).toFixed(8) + "BTC from " + storage[incoming.InstrumentId].BestOffer.toFixed(8) + "BTC to " + incoming.BestOffer.toFixed(8) + "BTC")
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });
//             }else{
//                 bot.sendWebhook({
//                     text: ("The best offer for " + crypto_array[incoming.InstrumentId - 1] + " has increased by " + (incoming.BestOffer - storage[incoming.InstrumentId.BestOffer]).toFixed(8) + "BTC from " + storage[incoming.InstrumentId].BestOffer.toFixed(8) + "BTC to " + incoming.BestOffer.toFixed(8) + "BTC")
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });
//             }
//         }
//     }else{
//         if(storage[incoming.InstrumentId].BestBid != incoming.BestBid){
//             if(storage[incoming.InstrumentId].BestBid > incoming.BestBid){
//                 bot.sendWebhook({
//                     text: ("The best bid for " + crypto_array[incoming.InstrumentId - 1] + " has dropped by $" + (storage[incoming.InstrumentId].BestBid - incoming.BestBid).toFixed(2) + " from $" + storage[incoming.InstrumentId].BestBid.toFixed(2) + " to $" + incoming.BestBid.toFixed(2))
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });

//             }else{
//                 bot.sendWebhook({
//                     text: ("The best bid for " + crypto_array[incoming.InstrumentId - 1] + " has increased by $" + (incoming.BestBid - storage[incoming.InstrumentId].BestBid).toFixed(2) + " from $" + storage[incoming.InstrumentId].BestBid.toFixed(2) + " to $" + incoming.BestBid.toFixed(2))
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });
//             }
//         }
//         if(storage[incoming.InstrumentId].BestOffer != incoming.BestOffer){
//             if(storage[incoming.InstrumentId].BestOffer > incoming.BestOffer){
//                 bot.sendWebhook({
//                     text: ("The best offer for " + crypto_array[incoming.InstrumentId - 1] + " has dropped by $" + (storage[incoming.InstrumentId].BestOffer - incoming.BestOffer).toFixed(2) + " from $" + storage[incoming.InstrumentId].BestOffer.toFixed(2) + " to $" + incoming.BestOffer.toFixed(2))
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });
//             }else{
//                 bot.sendWebhook({
//                     text: ("The best offer for " + crypto_array[incoming.InstrumentId - 1] + " has increased by $" + (incoming.BestOffer - storage[incoming.InstrumentId].BestOffer).toFixed(2) + " from $" + storage[incoming.InstrumentId].BestOffer.toFixed(2) + " to $" + incoming.BestOffer.toFixed(2))
//                     ,
//                     channel: '#price-alerts',
//                 },function(err,res) {
//                     if (err) {
//                     // ...
//                     }
//                 });
//             }
//         }
//     }
//     storage[incoming.InstrumentId] = incoming;
// }


// var cronJob = new CronJob(
//     '*/1 * * * *',
//     main,
//     console.log('Job completed: ' + new Date()),
//     true)

// cronJob.start();
// console.log('CronJob Status:', cronJob.running);

