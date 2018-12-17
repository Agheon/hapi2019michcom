import Hapi from 'hapi'
import hapiRouter from 'hapi-router'
import Vision from 'vision'
import Inert from 'inert'
import Handlebars from 'handlebars'
import Extend from 'handlebars-extend-block'
import hapiAuthCookie from 'hapi-auth-cookie'
import Moment from 'moment'
import dotEnv from 'dotenv'

dotEnv.load()

const server = Hapi.server({
    host: '0.0.0.0',
    port: process.env.SERVER_PORT || 8000
})

const init = async() => {
    try {
        await server.register([
            Vision,
            Inert,
            hapiAuthCookie
        ])
    } catch (error) {
        throw `ERROR IN REGISTER PLUGINS: ${error}`     
    }

    try {
        const cache = server.cache({segment: 'sessions', expiresIn: Moment.duration(24, 'hours').asMilliseconds() })
        server.app.cache = cache

        server.auth.strategy('session', 'cookie', {
            password: 'password-should-be-32-characters',
            cookie: 'sid-hapi2018',
            redirectTo: '/login',
            isSecure: false,
            validateFunc: async (request, session) => {
                const cached = await cache.get(session.sid)
                const out = {
                    valid: !!cached
                }

                if(out.valid) {
                    out.credentials = cached.account
                }

                return out
            }
        })

        server.auth.default('session')
    } catch (error) {
        throw `ERROR IN SESSIONS (COOKIE): ${error}`        
    }

    try {
        await server.register({
            plugin: hapiRouter,
            options: {
                routes: 'routes/**/*.js'
            }
        })
    } catch (error) {
        throw `ERROR IN ROUTES: ${error}`
    }

    try {
        await server.views({
            engines: {
                html: {
                    module: Extend(Handlebars),
                    isCached: false
                }
            },
            path: 'views',
            layoutPath: 'views/layout',
            layout: 'default'
        })
    } catch (error) {
        throw `ERROR IN VIEWS: ${error}`
    }

    await server.start()
    console.log(`Server started listening on ${server.info.uri}`)
} 

init()