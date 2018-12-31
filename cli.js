const argv = require('yargs').argv
const fs = require('fs');
const loader = require('./loader');

(async function main(){
    try {
        let fileLinks = await loader.getLinks(argv.url)
        //console.log(fileLinks);
        let reducedToStrings = fileLinks.join('\n');
        console.log(reducedToStrings);
    } catch (e) {
        console.error(e);
    }
})()

