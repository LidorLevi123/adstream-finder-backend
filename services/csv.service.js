import { createObjectCsvWriter } from 'csv-writer'
import fs from 'fs'

export const csvService = {
    exportToCSV
}

async function exportToCSV(data, filename) {
    try {
        // Ensure the data directory exists
        const dataDir = './data'
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir)
        }

        const outputPath = `./data/${filename}.csv`

        // Get headers from the first object's keys
        const headers = Object.keys(data[0]).map(key => ({
            id: key,
            title: key
        }))

        // Create a CSV writer
        const csvWriter = createObjectCsvWriter({
            path: outputPath,
            header: headers
        })

        // Write the data
        await csvWriter.writeRecords(data)

        return outputPath
    } catch (err) {
        throw new Error(`Failed to export CSV: ${err.message}`)
    }
}