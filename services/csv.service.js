import { createObjectCsvWriter } from 'csv-writer'
import { parse } from 'csv-parse'
import fs from 'fs'

export const csvService = {
    exportToCSV,
    parseCSV
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

async function parseCSV(filename) {
    try {
        const filePath = `./data/${filename}.csv`
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`)
        }

        // Read the file content
        const fileContent = fs.readFileSync(filePath, 'utf-8')

        // Create a promise to handle the parsing
        return new Promise((resolve, reject) => {
            parse(fileContent, {
                columns: true, // Automatically detect columns from header row
                skip_empty_lines: true,
                trim: true, // Trim whitespace from values
            }, (err, data) => {
                if (err) {
                    reject(new Error(`Failed to parse CSV: ${err.message}`))
                } else {
                    resolve(data)
                }
            })
        })
    } catch (err) {
        throw new Error(`Failed to read CSV: ${err.message}`)
    }
}