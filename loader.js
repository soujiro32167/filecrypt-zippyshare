const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const rp = require('request-promise');
const FC_DOMAIN = 'http://filecrypt.cc';
const fs = require('fs');

function toLink(linkid){
    return FC_DOMAIN + '/Link/' + escape(linkid) + '.html';
 }

module.exports = (function(){
    
    async function getLinks(filecryptUrl){
        try {
            let cookiejar = rp.jar();
            console.log('initial request to:', filecryptUrl);
            let fileCryptDom = await rp({
                uri: filecryptUrl,
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
                                Referrer: filecryptUrl 
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
            
            return  Promise.all(fileLinkPromises);
        } catch (e) {
            console.error(e);
        }
    }

    return {
        getLinks: getLinks
    }
})()