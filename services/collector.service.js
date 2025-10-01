import puppeteer from 'puppeteer'
import pLimit from 'p-limit'
import { logger } from './logger.service.js'

const DOMAINS = [
    'twitch.tv',
    'forbes.com',
    'vimeo.com',
    'rottentomatoes.com',
    'techcrunch.com',
    'netflix.com',
    'nonexistentdomain12345.com',
    'youtube.com',
    'hulu.com',
    'imdb.com',
    'metacritic.com',
    'primevideo.com',
    'disneyplus.com',
    'hbomax.com',
    'peacocktv.com',
    'crunchyroll.com',
    'funimation.com',
    'dailymotion.com',
    'variety.com',
    'deadline.com'
]

export const collectorService = {
    initiateCollector,
}

async function initiateCollector() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
        const limit = pLimit(5) // Allowing 5 domains to be analyzed at the same time
        const tasks = DOMAINS.map(domain => limit(() => collectData(browser, domain)))
        const res = await Promise.all(tasks)

        logger.debug('res:', JSON.stringify(res, null, 2))
    } catch (err) {
        logger.error('An unexpected error occurred in the collector:', err)
    } finally {
        browser.close()
    }
}

// Analyze a single domain for streaming content and ads
async function collectData(browser, domain) {
    let page

    try {
        page = await browser.newPage()
        const requestedUrls = new Set()

        await page.setUserAgent({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            platform: 'Win32'
        })

        // Enable request interception
        await page.setRequestInterception(true)

        page.on('request', request => {
            requestedUrls.add(request.url()) // Collect all URLs for analysis
            const resourceType = request.resourceType()
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                request.abort()
            } else {
                request.continue()
            }
        })

        const url = `https://${domain}`

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        })

        const hasStreaming = await checkStreaming(page, requestedUrls)
        const hasAds = await checkGoogleAds(page, requestedUrls)

        const res = { domain, hasStreaming, hasAds }
        return res

    } catch (error) {
        logger.error(`Error analyzing domain ${domain}:`, error)

        return {
            domain,
            hasStreaming: false,
            hasAds: false,
            error: error.message
        }
    } finally {
        page?.close()
    }
}

async function checkStreaming(page, requestedUrls) {
    try {
        // 1. Network Check: The most reliable method for modern streaming players
        if ([...requestedUrls].some(url => url.includes('.m3u8') || url.includes('.mpd'))) {
            return true
        }

        // 2. Fast URL Check: For known public streaming platforms
        const streamingPlatforms = [
            'youtube.com', 'netflix.com', 'twitch.tv', 'hulu.com',
            'disneyplus.com', 'primevideo.com', 'hbomax.com',
        ]

        const url = page.url()
        if (streamingPlatforms.some(platform => url.includes(platform))) {
            return true
        }

        // 3. DOM Check: Fallback for traditional video embeds
        return page.evaluate(() => {
            const hasVideoTag = document.querySelector('video')
            if (hasVideoTag) return true

            const embedSources = ['youtube.com/embed', 'player.vimeo.com', 'dailymotion.com/embed']
            const hasEmbedIframe = [...document.querySelectorAll('iframe')].some(iframe =>
                embedSources.some(source => iframe.src.includes(source))
            )
            if (hasEmbedIframe) return true

            const hasVideoMeta = document.querySelector('meta[property="og:video"]')
            return !!hasVideoMeta
        })
    } catch (err) {
        logger.error(`Error checking streaming for ${page.url()}:`, err.message)
        return false
    }
}

async function checkGoogleAds(page, requestedUrls) {
    // 1. Network Check: The most reliable sign of Google Ads
    if ([...requestedUrls].some(url => url.includes('googlesyndication.com') || url.includes('doubleclick.net'))) {
        return true
    }

    // 2. DOM Check: Fallback for specific ad elements
    return page.evaluate(() => {
        // Check for the container Google uses for AdSense
        const hasAdSenseElement = document.querySelector('.adsbygoogle')
        if (hasAdSenseElement) return true

        // Check for ad-related iframes
        return [...document.querySelectorAll('iframe')].some(iframe =>
            iframe.id.includes('google_ads_iframe') || iframe.src.includes('googleads')
        )
    })
}