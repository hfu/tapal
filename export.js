const fs = require('fs')
const byline = require('byline')
const { spawn, spawnSync } = require('child_process')

list = byline(spawn('ls', ['-S', 'dst']).stdout)
list.on('data', (line) => {
  const fn = line.toString()
  if (fn.split('-')[0] !== '6') return
  console.log(`exporting ${fn}`)
  const dst = `ndjson/${fn.replace('osm.pbf', 'ndjson')}`
  spawnSync('osmium', [
    'export', '--verbose', '--show-errors',
    '-i', 'sparse_file_array',
    '-c', 'osmium-export-config.json',
    '-f', 'geojsonseq',
    '--omit-rs', '-o', dst, `dst/${fn}`
  ], { stdio: 'inherit' })
  spawnSync('gzip', ['-9v', dst])
})
