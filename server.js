import express from 'express'
import cors from 'cors'
import path from 'path'

const app = express()

app.use(cors())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('public')))
} else {
    const corsOptions = {
        origin: [
            'http://localhost:5173'
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}

import { logger } from './services/logger.service.js'
import { collectorService } from './services/collector.service.js'
import { csvService } from './services/csv.service.js'

app.get('/api/collector-data', async (req, res) => {
    try {
        const data = await csvService.parseCSV('collector-data')
        res.json(data)
    } catch (err) {
        logger.error('Failed to fetch collector data: ' + err.message)
        res.status(500).json({ message: 'Failed to fetch collector data' })
    }
})

const port = process.env.PORT || 3030

app.listen(port, () => {
    logger.info('Server is running on port: ' + port)

    // Uncomment this to start the collector. 
    // When done it will store the csv file in the data folder.
    // collectorService.initiateCollector()
})
