const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const argv = require('yargs').argv
const rp = require('request-promise');
const FC_DOMAIN = 'http://filecrypt.cc';
const fs = require('fs');

function toLink(linkid){
   return FC_DOMAIN + '/Link/' + escape(linkid) + '.html';
}

(async function main(){
    try {
        let cookiejar = rp.jar();
        console.log('initial request to:', argv.url);
        let fileCryptDom = await rp({
            uri: argv.url,
            transform: (body) => new JSDOM(body),
            jar: cookiejar
        });

        let fileLinkPromises = [].slice.call(fileCryptDom.window.document.querySelectorAll('button.download'))
            .map(async button => {
                try{
                    let linkid = button.getAttribute('onclick').match(/'.*?'/)[0];
                    let decodeLink = toLink(linkid);
                    console.log('decode request to:', decodeLink);
                    let betweenResult = await rp({
                        uri: decodeLink,
                        jar: cookiejar,
                        headers: {
                            Referrer: argv.url 
                        }
                    });
                    let secondLink = betweenResult.match(/<iframe.*src="(.*?)"/)[1];
                    console.log('request for Zippyshare url:', secondLink);
                    let zippyshareResponse = await rp({
                        uri: secondLink,
                        jar: cookiejar,
                        //transform: (body) => new JSDOM(body)
                        resolveWithFullResponse: true
                    });
                    let zippyshareDomain = zippyshareResponse.request.uri.host;
                    console.log('zippyshare domain:', zippyshareResponse.request.uri.host);
                    let zippyshareDOM = new JSDOM(zippyshareResponse.body, {
                        runScripts: "outside-only"
                    });
                    //console.log(zippyshareDOM);
                    //console.log(zippyshareResponse);
                    //let downloadUrl = zippyshareDOM.window.document.querySelector('#dlbutton').getAttribute('href');
                    let [linkScript] = [].slice.call(zippyshareDOM.window.document.querySelectorAll('script'))
                        .map( script => script.innerHTML)
                        .filter(t => t.includes("document.getElementById('dlbutton').href"));
                    //console.log(linkScript);
                    zippyshareDOM.window.eval(linkScript);
                    let fileUrl = 'https://' +  zippyshareDomain + zippyshareDOM.window.document.getElementById('dlbutton').href;
                    //console.log(fileUrl);
                    return fileUrl;
                } catch(e){
                    console.error(e);
                }
            });
        
        let fileLinks = await Promise.all(fileLinkPromises);
        console.log(fileLinks);
        let reducedToStrings = fileLinks.reduce((acc, cur) => acc + cur + '\n', '');
        fs.promises.writeFile('link.txt', reducedToStrings);
    } catch (e) {
        console.error(e);
    }
})()

