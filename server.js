import 'dotenv/config'
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

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from AdStream Finder Backend!' })
})

import { logger } from './services/logger.service.js'
const port = process.env.PORT || 3030

app.listen(port, () => {
    logger.info('Server is running on port: ' + port)
})
