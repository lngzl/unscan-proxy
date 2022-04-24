import { rateLimit, host, port, origin } from './config.json'
import fastify from 'fastify'
import fastifyCompress from 'fastify-compress'
import fastifyCors from 'fastify-cors'
import fastifyHelmet from 'fastify-helmet'
import fastifyRateLimit from 'fastify-rate-limit'

const api = fastify()

api.register(fastifyCompress)
api.register(fastifyHelmet)
api.register(fastifyCors, {
  origin
})
api.register(fastifyRateLimit, {
  max: rateLimit,
  timeWindow: 60000 // a minute
})

api.get('/', async (req, res) => {
  try {
    const url = (req.query as { url: string }).url

    // validate request
    if (!url) {
      res.code(400)
  
      return {
        success: false,
        message: 'No URL specified.'
      }
    }
  
    // fetch file from url
    const data = await fetch(url)
  
    // create the request body
    const body = new FormData()
    body.append('file', await data.blob())
  
    // scan the file
    const result = await fetch('https://api.unscan.co/malware', {
      method: 'POST',
      body
    })
  
    // return the result
    return await result.json()
  } catch (err) {
    res.code(500)
  
    return {
      success: false,
      message: 'Something went wrong.'
    }
  }
})

api.setNotFoundHandler(async (req, res) => {
  res.code(404)
  
  return {
    success: false,
    message: 'Page not found.'
  }
})

const start = async () => {
  try {
    await api.listen(port, host)
    console.log('Proxy running!')
  } catch (err) {
    api.log.error(err)
    process.exit(1)
  }
}
start()