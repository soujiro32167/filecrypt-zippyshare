const express = require('express')
const PORT = process.env.PORT || 5000
const loader = require('./loader')

express()
  .get('/', (req, res) => res.send('Woot'))
  .get('/filecryptLinks', async (req, res) => {
    try {
        let url = req.query.url;
        let zippyshareLinks = await loader.getLinks(url);
        res.json(zippyshareLinks)
    } catch (e){
        next(e)
    }
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))